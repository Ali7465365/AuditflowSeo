import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Globe, Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth, useProfile } from '@/context/AuthContext';
import { AUDIT_STEPS, buildAuditPayload, type AuditRecord, type TargetKind } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP } from '@/lib/plans';
import { Link, useRouter } from '@/lib/router';
import { formatDate, getUsage } from '@/lib/usage';

const STEP_DURATION_MS = 900;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTarget(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes('.') ? url.toString() : null;
  } catch {
    return null;
  }
}

function detectKind(target: string): TargetKind {
  return /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(target) ? 'google_maps' : 'website';
}

export function NewAuditPage() {
  const profile = useProfile();
  const { refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const usage = getUsage(profile);
  const plan = PLAN_MAP[profile.plan];
  const limitReached = usage.remaining === 0;
  const running = activeStep !== null;
  const normalized = normalizeTarget(input);
  const kind = normalized ? detectKind(normalized) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running || limitReached) return;

    const target = normalizeTarget(input);
    if (!target) {
      setError('Enter a valid website address or Google Maps link.');
      return;
    }
    setError(null);

    const saving = supabase.rpc('record_audit', {
      p_payload: buildAuditPayload(target, detectKind(target)),
    });

    for (let step = 0; step < AUDIT_STEPS.length; step++) {
      setActiveStep(step);
      await wait(STEP_DURATION_MS);
    }

    const { data, error: saveError } = await saving;
    await refreshProfile();

    const audit = data as AuditRecord | null;
    if (saveError || !audit?.id) {
      setActiveStep(null);
      if (!saveError?.message.includes('AUDIT_LIMIT_REACHED')) {
        setError('We could not finish this audit. Please try again.');
      }
      return;
    }

    navigate(`/dashboard/audits/${audit.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">New audit</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Audit a business in seconds</h1>
          <p className="mt-2 text-slate-400">
            Paste a website or Google Maps link. We check speed, reviews, and SEO, then build the report.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
          {plan.name} plan
          <span className="text-slate-500">|</span>
          {usage.limit === null ? 'Unlimited audits' : `${usage.remaining} of ${usage.limit} left this month`}
        </span>
      </div>

      {limitReached ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">You have used all {usage.limit} audits for this month</h2>
              <p className="mt-2 leading-[1.6] text-slate-300">
                Your {plan.name} plan includes {usage.limit} audits per month. Your count resets on{' '}
                {formatDate(usage.nextBilling)}. Upgrade now to keep auditing without waiting.
              </p>
              <Link
                to="/dashboard/billing"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
              >
                View upgrade options
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : running ? (
        <AuditProgress activeStep={activeStep} target={normalized ?? input} />
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl sm:p-8">
          <label htmlFor="audit-target" className="block text-sm font-medium text-slate-300">
            Website or Google Maps link
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              {kind === 'google_maps' ? (
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
              ) : (
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              )}
              <input
                id="audit-target"
                type="text"
                inputMode="url"
                autoComplete="off"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="https://www.yourclient.com or a Google Maps link"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-base text-white placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Search className="h-4 w-4" />
              Run audit
            </button>
          </div>

          <div className="mt-4 flex min-h-6 items-center gap-2 text-sm text-slate-400">
            {kind && (
              <>
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Detected: {kind === 'google_maps' ? 'Google Maps listing' : 'Website audit'}
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-3 border-t border-white/5 pt-6 sm:grid-cols-3">
            {['PageSpeed score and mobile load time', 'Google rating and competitor gap', 'Missing tags and local search checks'].map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </p>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}

function AuditProgress({ activeStep, target }: { activeStep: number | null; target: string }) {
  const progress = activeStep === null ? 0 : ((activeStep + 1) / AUDIT_STEPS.length) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl">
      <p className="text-sm text-slate-400">Auditing</p>
      <p className="mt-1 truncate text-lg font-semibold text-white">{target}</p>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <ol className="mt-8 space-y-5">
        {AUDIT_STEPS.map((label, index) => {
          const done = activeStep !== null && index < activeStep;
          const current = index === activeStep;
          return (
            <li key={label} className={`flex items-center gap-4 transition-opacity duration-300 ${done || current ? 'opacity-100' : 'opacity-40'}`}>
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : current ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
              <span className={`text-sm font-medium ${current ? 'text-white' : 'text-slate-300'}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
