import { Check, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PaymentMethodModal } from '@/components/billing/PaymentMethodModal';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { useAuth, useProfile } from '@/context/AuthContext';
import { getPaymentMethod, type PaymentMethodId } from '@/lib/paymentMethods';
import { changePlan } from '@/lib/planChange';
import { PLANS, PLAN_MAP, formatPrice, type Plan } from '@/lib/plans';
import { formatDate, getUsage } from '@/lib/usage';

export function BillingPage() {
  const profile = useProfile();
  const { setProfile } = useAuth();
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const usage = getUsage(profile);
  const currentPlan = PLAN_MAP[profile.plan];

  async function confirmPlan(plan: Plan, method: PaymentMethodId) {
    const updated = await changePlan(plan.id);
    setProfile(updated);
    setTargetPlan(null);
    setNotice(
      `Your plan is now ${plan.name}. Payment method: ${getPaymentMethod(method).label} (demo mode, no charge was made).`,
    );
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
          <p className="mt-1 text-sm text-slate-400">{formatPrice(currentPlan.price)} / month</p>
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

      {notice && (
        <p role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Available plans</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === profile.plan;
            const isUpgrade = plan.rank > currentPlan.rank;
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
                  onClick={() => setTargetPlan(plan)}
                  disabled={isCurrent}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'border border-indigo-500/40 text-indigo-200'
                      : 'bg-indigo-600 text-white hover:-translate-y-0.5 hover:bg-indigo-500'
                  }`}
                >
                  {label}
                </button>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-slate-500">Demo billing: plan changes apply instantly and no payment is collected.</p>
      </section>

      {targetPlan && (
        <PaymentMethodModal
          planName={targetPlan.name}
          priceLabel={`${formatPrice(targetPlan.price)} / month`}
          onClose={() => setTargetPlan(null)}
          onContinue={(method) => confirmPlan(targetPlan, method)}
        />
      )}
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
