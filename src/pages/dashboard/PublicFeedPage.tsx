import { MessageSquare, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type AuditRecord, computeOverallScore } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/usage';
import { Link } from '@/lib/router';

interface RawFeedRow extends AuditRecord {
  audit_comments: { count: number }[];
}

interface FeedItem extends AuditRecord {
  comment_count: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: FeedItem[] };

const FEED_COLUMNS = `
  id, target_url, target_kind, business_name,
  pagespeed_score, mobile_load_time_s,
  review_rating, review_count, competitor_rating, competitor_review_count,
  seo_checks, created_at, is_published, published_at,
  audit_comments(count)
`;

export function PublicFeedPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    (async () => {
      setState({ status: 'loading' });
      const { data, error } = await supabase
        .from('audits')
        .select(FEED_COLUMNS)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (!active) return;
      if (error) {
        setState({ status: 'error', message: 'Could not load the public feed. Please refresh.' });
        return;
      }

      const items = ((data ?? []) as unknown as RawFeedRow[]).map((row) => ({
        ...row,
        comment_count: Array.isArray(row.audit_comments) ? (row.audit_comments[0]?.count ?? 0) : 0,
      }));
      setState({ status: 'ready', items });
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
          <Newspaper className="h-4 w-4" aria-hidden="true" /> Public feed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Community audits</h1>
        <p className="mt-2 text-slate-400">Published SEO audits from AuditFlow users. Open any report to view the full breakdown and leave a comment.</p>
      </div>

      {state.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading feed...</p>}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">No published audits yet</p>
          <p className="mt-2 text-slate-400">Publish one of your saved audits and it will appear here for the community.</p>
          <Link to="/dashboard/saved" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Go to saved audits
          </Link>
        </div>
      )}

      {state.status === 'ready' && state.items.length > 0 && (
        <ul className="space-y-4">
          {state.items.map((item) => {
            const overall = computeOverallScore(item);
            const title = item.business_name ?? item.target_url;
            return (
              <li key={item.id}>
                <Link
                  to={`/dashboard/feed/${encodeURIComponent(item.id)}`}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">{title}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">{item.target_url}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Published {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {item.comment_count} {item.comment_count === 1 ? 'comment' : 'comments'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 sm:shrink-0">
                    <FeedStat label="Overall" value={overall} />
                    <FeedStat label="PageSpeed" value={item.pagespeed_score} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FeedStat({ label, value }: { label: string; value: number }) {
  const tone = value >= 90 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-rose-400';
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
