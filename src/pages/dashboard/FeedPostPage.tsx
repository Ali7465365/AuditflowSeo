import { ArrowLeft, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuditReport } from '@/components/report/AuditReport';
import { useProfile } from '@/context/AuthContext';
import { type AuditRecord } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP } from '@/lib/plans';
import { formatDate } from '@/lib/usage';
import { isCleanComment } from '@/lib/comments';
import { Link, useRouter } from '@/lib/router';

interface Comment {
  id: string;
  audit_id: string;
  user_id: string;
  author_email: string;
  body: string;
  created_at: string;
}

interface FeedPostPageProps {
  auditId: string;
}

const AUDIT_COLUMNS =
  'id, target_url, target_kind, business_name, pagespeed_score, mobile_load_time_s, review_rating, review_count, competitor_rating, competitor_review_count, seo_checks, created_at, is_published, published_at';
const COMMENT_COLUMNS = 'id, audit_id, user_id, author_email, body, created_at';

type AuditState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; audit: AuditRecord };

export function FeedPostPage({ auditId }: FeedPostPageProps) {
  const profile = useProfile();
  const { navigate } = useRouter();
  const [auditState, setAuditState] = useState<AuditState>({ status: 'loading' });
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentNotice, setCommentNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setAuditState({ status: 'loading' });
      const { data, error } = await supabase
        .from('audits')
        .select(AUDIT_COLUMNS)
        .eq('id', auditId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setAuditState({ status: 'error' });
        return;
      }
      if (!data) {
        setAuditState({ status: 'missing' });
        return;
      }
      const audit = data as AuditRecord;
      if (!audit.is_published) {
        setAuditState({ status: 'missing' });
        return;
      }
      setAuditState({ status: 'ready', audit });
    })();

    return () => {
      active = false;
    };
  }, [auditId]);

  useEffect(() => {
    if (auditState.status !== 'ready') return;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('audit_comments')
        .select(COMMENT_COLUMNS)
        .eq('audit_id', auditId)
        .order('created_at', { ascending: true });
      if (active && data) setComments(data as Comment[]);
    })();

    return () => {
      active = false;
    };
  }, [auditState, auditId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = isCleanComment(input);
    if (!check.ok) {
      setCommentError(check.reason ?? 'Comment cannot be empty.');
      setCommentNotice(null);
      return;
    }

    setSubmitting(true);
    setCommentError(null);
    setCommentNotice(null);

    const { data, error } = await supabase
      .from('audit_comments')
      .insert({
        audit_id: auditId,
        user_id: profile.user_id,
        author_email: profile.email,
        body: input.trim(),
      })
      .select(COMMENT_COLUMNS)
      .single();

    setSubmitting(false);
    setInput('');

    if (error || !data) {
      setCommentError('Your comment could not be posted. Please try again.');
      setInput(input);
      return;
    }

    setComments((prev) => [...prev, data as Comment]);
  }

  async function handleDelete(commentId: string) {
    const { error } = await supabase.from('audit_comments').delete().eq('id', commentId);
    if (error) {
      setCommentError('Could not delete that comment. Please try again.');
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const plan = PLAN_MAP[profile.plan];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 print:hidden">
        <Link to="/dashboard/feed" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
      </div>

      {auditState.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading post...</p>}

      {auditState.status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          We could not load this post. Please refresh the page.
        </p>
      )}

      {auditState.status === 'missing' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">This post is not available</p>
          <p className="mt-2 text-slate-400">It may have been unpublished or removed.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/feed', { replace: true })}
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Back to feed
          </button>
        </div>
      )}

      {auditState.status === 'ready' && (
        <>
          <AuditReport
            audit={auditState.audit}
            removesWatermark={plan.removesWatermark}
            logoData={profile.agency_logo_data}
            planId={plan.id}
          />

          <section className="mt-10 print:hidden">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">Comments</h2>
              <span className="text-sm text-slate-500">({comments.length})</span>
            </div>

            <p className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-sm text-indigo-200">
              Use this post as proof with your client. Keep comments professional and useful.
            </p>

            <div ref={scrollRef} className="mb-6 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/40 p-4">
              {comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No comments yet. Be the first to share feedback.</p>
              ) : (
                comments.map((comment) => {
                  const isMine = comment.user_id === profile.user_id;
                  return (
                    <div key={comment.id} className="rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-200">{comment.author_email || 'Anonymous'}</p>
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              aria-label="Delete your comment"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-[1.5] text-slate-300">{comment.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {commentError && (
              <p role="alert" className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
                {commentError}
              </p>
            )}
            {commentNotice && (
              <p role="status" className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">
                {commentNotice}
              </p>
            )}

            <form onSubmit={handleComment} className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleComment(event as unknown as FormEvent<HTMLFormElement>);
                  }
                }}
                placeholder="Add a professional comment..."
                rows={2}
                maxLength={500}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || submitting}
                aria-label="Post comment"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500">{input.length}/500 · Press Enter to post. Shift + Enter for a new line.</p>
          </section>
        </>
      )}
    </div>
  );
}
