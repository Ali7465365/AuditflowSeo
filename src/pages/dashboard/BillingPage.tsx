import { Check, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useProfile, type Profile } from '@/context/AuthContext';
import { PLANS, PLAN_MAP, formatPrice, type Plan, type PlanId } from '@/lib/plans';
import { supabase } from '@/lib/supabase';
import { Link } from '@/lib/router';
import { formatDate, getUsage } from '@/lib/usage';
import { UsageBar } from '@/components/dashboard/UsageBar';

export function BillingPage() {
  const profile = useProfile();
  const { setProfile } = useAuth();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const usage = getUsage(profile);
  const currentPlan = PLAN_MAP[profile.plan];

  async function changePlan(plan: Plan) {
    if (pendingPlan || plan.id === profile.plan) return;
    setError(null);
    setNotice(null);
    setPendingPlan(plan.id);

    const { data, error: rpcError } = await supabase.rpc('set_plan', { p_plan: plan.id });
    setPendingPlan(null);

    if (rpcError || !data) {
      setError('We could not change your plan. Please try again.');
      return;
    }
    setProfile(data as Profile);
    setNotice(`Your plan is now ${plan.name}. New limits apply immediately.`);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Plan & billing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Your plan and audit credits</h1>
        <p className="mt-2 text-slate-400">Upgrade or downgrade at any time. Changes take effect immediately.</p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl sm:p-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current plan</p>
          <p className="mt-2 text-2xl font-bold text-white">{currentPlan.name}</p>
          <p className="mt-1 text-sm text-slate-400">
            {formatPrice(currentPlan.price)} / month
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
          <Stat label="Next billing date" value={formatDate(usage.nextBilling)} />
          <Stat
            label="Remaining audit credits"
            value={usage.remaining === null ? 'Unlimited' : `${usage.remaining} of ${usage.limit}`}
          />
          <div className="sm:col-span-2">
            <UsageBar profile={profile} />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Available plans</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === profile.plan;
            const isUpgrade = plan.rank > currentPlan.rank;
            const busy = pendingPlan === plan.id;
            const label = isCurrent ? 'Current plan' : isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`;

            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 transition-colors ${
                  isCurrent ? 'border-indigo-500/60 bg-indigo-600/10' : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                  {formatPrice(plan.price)}
                  <span className="text-sm font-medium text-slate-400"> / mo</span>
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {plan.auditLimit === null ? 'Unlimited audits' : `${plan.auditLimit} audits / month`}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-400">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => changePlan(plan)}
                  disabled={isCurrent || pendingPlan !== null}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'border border-indigo-500/40 text-indigo-200'
                      : 'bg-indigo-600 text-white hover:-translate-y-0.5 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0'
                  }`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {label}
                </button>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Demo billing: plan changes apply instantly and no payment is collected.{' '}
          <Link to="/" className="text-slate-400 underline-offset-4 hover:text-white hover:underline">
            Back to the public site
          </Link>
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950/60 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
