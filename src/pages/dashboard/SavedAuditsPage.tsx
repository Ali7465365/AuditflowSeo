import { Download, Eye, History, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from '@/lib/router';
import { formatDate } from '@/lib/usage';

interface AuditSummary {
  id: string;
  target_url: string;
  target_kind: 'website' | 'google_maps';
  business_name: string | null;
  pagespeed_score: number;
  review_rating: number | null;
  review_count: number | null;
  created_at: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; audits: AuditSummary[] };

const SUMMARY_COLUMNS =
  'id, target_url, target_kind, business_name, pagespeed_score, review_rating, review_count, created_at';

function scoreTone(score: number) {
  if (score >= 90) return 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20';
  if (score >= 50) return 'text-amber-300 bg-amber-500/10 ring-amber-500/20';
  return 'text-rose-300 bg-rose-500/10 ring-rose-500/20';
}

export function SavedAuditsPage() {
  const { navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(SUMMARY_COLUMNS)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error || !Array.isArray(data)) {
        setState({ status: 'error' });
      } else {
        setState({ status: 'ready', audits: data as AuditSummary[] });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(auditId: string) {
    const confirmed = window.confirm('Permanently delete this audit? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(auditId);
    setMessage(null);

    const { error, count } = await supabase
      .from('audits')
      .delete({ count: 'exact' })
      .eq('id', auditId);

    setDeletingId(null);

    if (error) {
      setMessage('Failed to delete audit. Please try again.');
      return;
    }

    if (count === 0) {
      setState((prev) => {
        if (prev.status !== 'ready') return prev;
        return { status: 'ready', audits: prev.audits.filter((a) => a.id !== auditId) };
      });
      setMessage('This audit was already removed.');
      return;
    }

    setState((prev) => {
      if (prev.status !== 'ready') return prev;
      return {
        status: 'ready',
        audits: prev.audits.filter((a) => a.id !== auditId),
      };
    });

    setMessage('Audit permanently deleted. Your monthly audit count is unchanged.');
  }

  const audits = state.status === 'ready' ? state.audits : [];
  const averageSpeed = audits.length
    ? Math.round(audits.reduce((sum, audit) => sum + audit.pagespeed_score, 0) / audits.length)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
            <History className="h-4 w-4" aria-hidden="true" /> History
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Audit History</h1>
          <p className="mt-2 text-slate-400">Every audit you have run, ready to view or download as a PDF.</p>
        </div>
        <Link
          to="/dashboard/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New Audit
        </Link>
      </div>

      {state.status === 'ready' && audits.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total audits" value={String(audits.length)} />
          <SummaryCard label="Average speed score" value={averageSpeed === null ? '—' : `${averageSpeed} / 100`} />
          <SummaryCard label="Latest audit" value={formatDate(audits[0].created_at)} />
        </div>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {state.status === 'loading' && (
        <p className="py-20 text-center text-slate-400">Loading your history...</p>
      )}

      {state.status === 'error' && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Could not load history. Please refresh.
        </p>
      )}

      {state.status === 'ready' && audits.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">No audits yet</p>
          <p className="mt-2 text-slate-400">Run your first audit and it will appear here.</p>
          <Link
            to="/dashboard/new"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Run an Audit
          </Link>
        </div>
      )}

      {audits.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Business</th>
                  <th className="px-6 py-4 font-semibold">Speed</th>
                  <th className="px-6 py-4 font-semibold">Reviews</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {audits.map((audit) => (
                  <tr key={audit.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{audit.business_name ?? audit.target_url}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {audit.target_kind === 'google_maps' ? 'Google Maps' : 'Website'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${scoreTone(audit.pagespeed_score)}`}>
                        {audit.pagespeed_score} / 100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {audit.review_rating === null ? '—' : `${audit.review_rating.toFixed(1)} (${audit.review_count ?? 0})`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(audit.created_at)}</td>
                    <td className="px-6 py-4">
                      <AuditActions
                        auditId={audit.id}
                        deleting={deletingId === audit.id}
                        onPdf={() => navigate(`/dashboard/audits/${audit.id}?download=1`)}
                        onDelete={() => handleDelete(audit.id)}
                        className="justify-end"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-4 md:hidden">
            {audits.map((audit) => (
              <li key={audit.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{audit.business_name ?? audit.target_url}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {audit.target_kind === 'google_maps' ? 'Google Maps' : 'Website'} · {formatDate(audit.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${scoreTone(audit.pagespeed_score)}`}>
                    {audit.pagespeed_score} / 100
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Reviews:{' '}
                  <span className="text-slate-200">
                    {audit.review_rating === null ? '—' : `${audit.review_rating.toFixed(1)} (${audit.review_count ?? 0})`}
                  </span>
                </p>
                <AuditActions
                  auditId={audit.id}
                  deleting={deletingId === audit.id}
                  onPdf={() => navigate(`/dashboard/audits/${audit.id}?download=1`)}
                  onDelete={() => handleDelete(audit.id)}
                  className="mt-4 grid grid-cols-3"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

interface AuditActionsProps {
  auditId: string;
  deleting: boolean;
  onPdf: () => void;
  onDelete: () => void;
  className?: string;
}

function AuditActions({ auditId, deleting, onPdf, onDelete, className = '' }: AuditActionsProps) {
  const buttonBase = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link
        to={`/dashboard/audits/${auditId}`}
        className={`${buttonBase} border border-white/10 text-slate-200 hover:bg-white/5`}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
      </Link>
      <button type="button" onClick={onPdf} className={`${buttonBase} bg-indigo-600 font-semibold text-white hover:bg-indigo-500`}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" /> PDF
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className={`${buttonBase} border border-rose-500/40 text-rose-300 hover:bg-rose-500/10`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {deleting ? '...' : 'Delete'}
      </button>
    </div>
  );
}
