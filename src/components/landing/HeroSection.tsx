import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { Link } from '@/lib/router';

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SAMPLE_SCORE = 72;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Built for local SEO agencies and freelancers
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Close $500/Mo Local Clients in{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-sky-300 bg-clip-text text-transparent">
              10 Seconds
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-[1.6] text-slate-400">
            Automated site speed, Google Maps, and review audits in one beautiful PDF report.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/auth?mode=signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/sample"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-100 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <FileText className="h-4 w-4" />
              View Sample Audit PDF
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            {['No credit card needed', '3 free audits every month', 'White-label PDFs'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-transparent blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Audit report</p>
                <p className="mt-1 text-lg font-semibold text-white">Brightside Dental Care</p>
                <p className="text-sm text-slate-400">brightsidedentalcare.com</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Completed in 9s
              </span>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-6 py-6">
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-amber-400"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - SAMPLE_SCORE / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{SAMPLE_SCORE}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">PageSpeed</span>
                </div>
              </div>
              <div className="space-y-3">
                <MiniStat label="Mobile load time" value="3.4s" />
                <MiniStat label="Google rating" value="4.6 (128 reviews)" />
                <MiniStat label="Competitor gap" value="-284 reviews" tone="warning" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-5">
              <Tag label="Meta description missing" tone="error" />
              <Tag label="Local schema missing" tone="error" />
              <Tag label="Mobile viewport OK" tone="success" />
              <Tag label="Profile linked" tone="success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-4 py-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${tone === 'warning' ? 'text-amber-300' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function Tag({ label, tone }: { label: string; tone: 'success' | 'error' }) {
  const styles =
    tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${styles}`}>{label}</span>;
}
