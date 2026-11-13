import { ArrowLeft, Eye, EyeOff, Loader2, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuditReport } from '@/components/report/AuditReport';
import { useProfile } from '@/context/AuthContext';
import { type AuditRecord } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP } from '@/lib/plans';
import { Link, useRouter } from '@/lib/router';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; audit: AuditRecord };

interface AuditResultPageProps {
  auditId: string;
}

const AUDIT_COLUMNS =
  'id, target_url, target_kind, business_name, pagespeed_score, mobile_load_time_s, review_rating, review_count, competitor_rating, competitor_review_count, seo_checks, created_at, is_published, published_at';

export function AuditResultPage({ auditId }: AuditResultPageProps) {
  const profile = useProfile();
  const { search, pathname, navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [publishing, setPublishing] = useState(false);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const autoDownload = new URLSearchParams(search).get('download') === '1';

  useEffect(() => {
    let active = true;

    (async () => {
      setState({ status: 'loading' });
      const { data, error } = await supabase
        .from('audits')
        .select(AUDIT_COLUMNS)
        .eq('id', auditId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setState({ status: 'error' });
      } else if (!data) {
        setState({ status: 'missing' });
      } else {
        setState({ status: 'ready', audit: data as AuditRecord });
      }
    })();

    return () => {
      active = false;
    };
  }, [auditId]);

  const isReady = state.status === 'ready';

  useEffect(() => {
    if (!isReady || !autoDownload) return;
    const timer = window.setTimeout(() => {
      window.print();
      navigate(pathname, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [isReady, autoDownload, pathname, navigate]);

  const plan = PLAN_MAP[profile.plan];

  async function handleTogglePublish() {
    if (state.status !== 'ready') return;
    setPublishing(true);
    setPublishNotice(null);
    setPublishError(null);

    const willPublish = !state.audit.is_published;
    const { data, error } = await supabase
      .from('audits')
      .update({
        is_published: willPublish,
        published_at: willPublish ? new Date().toISOString() : null,
      })
      .eq('id', auditId)
      .select(AUDIT_COLUMNS)
      .maybeSingle();

    setPublishing(false);

    if (error || !data) {
      setPublishError(willPublish ? 'Could not publish this audit. Please try again.' : 'Could not unpublish this audit. Please try again.');
      return;
    }

    setState({ status: 'ready', audit: data as AuditRecord });
    setPublishNotice(willPublish ? 'This audit is now published to the public feed.' : 'This audit has been removed from the public feed.');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link to="/dashboard/saved" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Saved audits
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Audit results</h1>
        </div>
        {isReady && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishing}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                state.audit.is_published
                  ? 'border-rose-500/40 text-rose-200 hover:bg-rose-500/10'
                  : 'border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : state.audit.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {state.audit.is_published ? 'Unpublish' : 'Publish to Feed'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {publishError && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 print:hidden">
          {publishError}
        </p>
      )}
      {publishNotice && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 print:hidden">
          {publishNotice}
        </p>
      )}

      {state.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading audit...</p>}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          We could not load this audit. Please refresh the page and try again.
        </p>
      )}

      {state.status === 'missing' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">This audit could not be found</p>
          <p className="mt-2 text-slate-400">It may have been removed, or the link is incorrect.</p>
          <Link to="/dashboard/saved" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Back to saved audits
          </Link>
        </div>
      )}

      {state.status === 'ready' && (
        <AuditReport
          audit={state.audit}
          removesWatermark={plan.removesWatermark}
          logoData={profile.agency_logo_data}
          planId={plan.id}
        />
      )}
    </div>
  );
}
