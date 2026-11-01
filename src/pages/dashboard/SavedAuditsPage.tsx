import { Download, Eye, PlusCircle, Trash2 } from 'lucide-react';
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
    const confirmed = window.confirm('Are you sure you want to delete this audit?');
    if (!confirmed) return;

    setDeletingId(auditId);
    setMessage(null);

    const { error } = await supabase.from('audits').delete().eq('id', auditId);

    setDeletingId(null);

    if (error) {
      setMessage('Failed to delete audit. Please try again.');
      return;
    }

    // Remove from list (do NOT change audits_used count)
    setState((prev) => {
      if (prev.status !== 'ready') return prev;
      return {
        status: 'ready',
        audits: prev.audits.filter((a) => a.id !== auditId),
      };
    });

    setMessage('Audit deleted successfully');
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Saved audits</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Your audit history</h1>
          <p className="mt-2 text-slate-400">Open any report or download it again as a PDF.</p>
        </div>
        <Link
          to="/dashboard/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" />
          New audit
        </Link>
      </div>

      {message && (
        <p className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {state.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading your audits...</p>}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          We could not load your saved audits. Please refresh the page and try again.
        </p>
      )}

      {state.status === 'ready' && state.audits.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">No audits yet</p>
          <p className="mt-2 text-slate-400">Run your first audit and it will appear here.</p>
          <Link to="/dashboard/new" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Run an audit
          </Link>
        </div>
      )}

      {state.status === 'ready' && state.audits.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Business</th>
                  <th className="px-6 py--4 font-semibold">Speed</th>
                  <th className="px-6 py-4 font-semibold">Reviews</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.audits.map((audit) => (
                  <tr key={audit.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{audit.business_name ?? audit.target_url}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {audit.target_kind === 'google_maps' ? 'Google Maps listing' : 'Website'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${audit.pagespeed_score >= 90 ? 'text-emerald-300' : audit.pagespeed_score >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                        {audit.pagespeed_score}
                      </span>
                      <span className="text-slate-500"> / 100</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {audit.review_rating === null ? 'No data' : `${audit.review_rating.toFixed(1)} (${audit.review_count ?? 0})`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(audit.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/dashboard/audits/${audit.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/audits/${audit.id}?download=1`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/90 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(audit.id)}
                          disabled={deletingId === audit.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === audit.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}