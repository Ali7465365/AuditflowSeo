import { Lock, Sparkles, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth, useProfile } from '@/context/AuthContext';
import { PLAN_MAP, type PlanId } from '@/lib/plans';
import { useRouter } from '@/lib/router';

interface GateContext {
  title: string;
  message: string;
  requiredPlan: PlanId;
}

export function usePlanGate() {
  const profile = useProfile();
  const { setProfile } = useAuth();
  const [gate, setGate] = useState<GateContext | null>(null);

  function requirePlan(requiredPlan: PlanId, title: string, message: string): boolean {
    if (PLAN_MAP[profile.plan].rank >= PLAN_MAP[requiredPlan].rank) return true;
    setGate({ title, message, requiredPlan });
    return false;
  }

  function gateElement() {
    return gate ? <UpgradeModal gate={gate} onClose={() => setGate(null)} /> : null;
  }

  return { requirePlan, gateElement, profile, setProfile };
}

export function UpgradeModal({ gate, onClose }: { gate: GateContext; onClose: () => void }) {
  const { navigate } = useRouter();
  const plan = PLAN_MAP[gate.requiredPlan];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-modal-in relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Lock className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-white">{gate.title}</h2>
        <p className="mt-2 text-sm leading-[1.6] text-slate-400">{gate.message}</p>
        <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <Sparkles className="h-4 w-4" /> {plan.name} — ${plan.price.toFixed(2)}/month
          </p>
          <p className="mt-1 text-xs text-indigo-300/80">{plan.audience}</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dashboard/billing');
            }}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockedFeatureCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 px-6 py-10 text-center">{children}</div>
  );
}
