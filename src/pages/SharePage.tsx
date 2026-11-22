import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuditReport } from '@/components/report/AuditReport';
import { type AuditRecord } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP, type PlanId } from '@/lib/plans';

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; audit: AuditRecord; ownerPlan: PlanId };

interface SharePageProps {
  token: string;
}

interface SharedRow extends AuditRecord {
  owner_plan: PlanId | null;
}

export function SharePage({ token }: SharePageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    (async () => {
      setState({ status: 'loading' });
      const { data, error } = await supabase.rpc('get_shared_audit', { p_token: token });

      if (!active) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        setState({ status: 'missing' });
        return;
      }
      const { owner_plan, ...audit } = row as SharedRow;
      setState({ status: 'ready', audit: audit as AuditRecord, ownerPlan: (owner_plan ?? 'free') as PlanId });
    })();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {state.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading report...</p>}

        {state.status === 'missing' && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-300">
              <Link2 className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-white">This link is not available</h1>
            <p className="mt-2 text-sm text-slate-400">The report may have been unshared, or the link is incorrect.</p>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Shared audit report</p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {state.audit.business_name ?? state.audit.target_url}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Use this report as proof of work with your client.
              </p>
            </div>
            <AuditReport audit={state.audit} removesWatermark={PLAN_MAP[state.ownerPlan].removesWatermark} logoData={null} planId={state.ownerPlan} />
            {PLAN_MAP[state.ownerPlan].rank === 0 && (
              <p className="mt-6 text-center text-xs text-slate-500">Generated with AuditFlow SEO</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
