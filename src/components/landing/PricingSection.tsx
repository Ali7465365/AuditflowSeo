import { Check, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PaymentMethodModal } from '@/components/billing/PaymentMethodModal';
import { useAuth } from '@/context/AuthContext';
import { getPaymentMethod, type PaymentMethodId } from '@/lib/paymentMethods';
import { changePlan } from '@/lib/planChange';
import { PLANS, formatPrice, type Plan } from '@/lib/plans';
import { useRouter } from '@/lib/router';

function auditLimitLabel(plan: Plan) {
  return plan.auditLimit === null ? 'Unlimited audits / month' : `${plan.auditLimit} audits / month`;
}

export function PricingSection() {
  const { session, profile, setProfile } = useAuth();
  const { navigate } = useRouter();
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleContinue(plan: Plan, method: PaymentMethodId) {
    if (!session) {
      setTargetPlan(null);
      navigate(`/auth?mode=signup&plan=${plan.id}`);
      return;
    }
    const updated = await changePlan(plan.id);
    setProfile(updated);
    setTargetPlan(null);
    setNotice(
      `Your plan is now ${plan.name}. Payment method: ${getPaymentMethod(method).label} (demo mode, no charge was made).`,
    );
  }

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-white/5 bg-slate-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.2]">
            Plans that grow with your client list
          </h2>
          <p className="mt-4 text-lg leading-[1.6] text-slate-400">
            Start free, then upgrade when your audits start paying for themselves.
          </p>
        </div>

        {notice && (
          <p role="status" className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        )}

        <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={Boolean(session && profile?.plan === plan.id)}
              onSelect={() => setTargetPlan(plan)}
            />
          ))}
        </div>
      </div>

      {targetPlan && (
        <PaymentMethodModal
          planName={targetPlan.name}
          priceLabel={`${formatPrice(targetPlan.price)} / month`}
          onClose={() => setTargetPlan(null)}
          onContinue={(method) => handleContinue(targetPlan, method)}
        />
      )}
    </section>
  );
}

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, isCurrent, onSelect }: PlanCardProps) {
  const highlighted = Boolean(plan.highlighted);

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
        highlighted
          ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-600/20 to-slate-900 shadow-2xl shadow-indigo-600/20'
          : 'border-white/10 bg-slate-900/60 hover:border-white/20'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <Sparkles className="h-3 w-3" />
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <p className="mt-1 min-h-[2.5rem] text-sm leading-[1.5] text-slate-400">{plan.audience}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-white">{formatPrice(plan.price)}</span>
        <span className="text-sm text-slate-400">/ month</span>
      </div>

      <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-200">{auditLimitLabel(plan)}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-[1.5] text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={isCurrent}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
          isCurrent
            ? 'border border-indigo-500/40 text-indigo-200'
            : highlighted
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 hover:bg-indigo-500'
              : 'border border-white/10 bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10'
        }`}
      >
        {isCurrent ? 'Current plan' : 'Select Plan'}
      </button>
    </article>
  );
}
