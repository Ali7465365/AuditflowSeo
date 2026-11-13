import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { changePlan } from '@/lib/planChange';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP, type PlanId } from '@/lib/plans';
import { Link, useRouter } from '@/lib/router';
import { isTempEmail } from '@/lib/emailValidation';

// before supabase.auth.signUp
if (isTempEmail(email)) {
  setError('Temporary emails are not allowed. Please use a real email address.');
  return;
}

const PAID_PLAN_IDS: string[] = ['pro', 'ultra', 'exclusive'];

function describeAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'That email and password do not match. Please try again.';
  }
  if (lower.includes('password')) {
    return 'Please choose a stronger password with at least 6 characters.';
  }
  if (lower.includes('email')) {
    return 'Enter a valid email address.';
  }
  return 'Something went wrong. Please try again.';
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

export function AuthPage() {
  const { search, navigate } = useRouter();
  const { session, setProfile } = useAuth();
  const params = new URLSearchParams(search);
  const planParam = params.get('plan');
  const selectedPlan = planParam && PAID_PLAN_IDS.includes(planParam) ? (planParam as PlanId) : null;

  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session && !submitting) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, submitting, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(describeAuthError(signUpError.message));
          return;
        }
        if (!data.session) {
          setNotice('Your account was created. Sign in with your email and password to continue.');
          setMode('signin');
          return;
        }
        if (selectedPlan) {
          try {
            setProfile(await changePlan(selectedPlan));
          } catch {
            setError('Your account was created, but the plan could not be selected. You can choose it on the billing page.');
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(describeAuthError(signInError.message));
          return;
        }
      }
      navigate('/dashboard', { replace: true });
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setError(null);
    setNotice(null);
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
  }

  const isSignup = mode === 'signup';

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-white/5 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <Logo />
        <div className="relative">
          <h2 className="text-4xl font-bold leading-[1.2] tracking-tight text-white">
            Turn every audit into a signed client.
          </h2>
          <ul className="mt-8 space-y-4 text-slate-300">
            {[
              'PageSpeed, Google reviews, and SEO checks in one run',
              'White-label PDFs with your own logo on paid plans',
              'Monthly limits that keep your costs predictable',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 leading-[1.5]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-slate-400">
            {isSignup ? 'Start with 3 free audits. No credit card needed.' : 'Sign in to run audits and manage your plan.'}
          </p>

          {selectedPlan && isSignup && (
            <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
              You selected the <span className="font-semibold">{PLAN_MAP[selectedPlan].name}</span> plan. It will be applied to your new account.
            </div>
          )}

          {notice && (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@agency.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? 'Creating your account...' : 'Signing you in...'}
                </>
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isSignup ? 'Already have an account?' : 'New to AuditFlow SEO?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300">
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-6 text-center text-sm">
            <Link to="/" className="text-slate-500 transition-colors hover:text-slate-300">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
