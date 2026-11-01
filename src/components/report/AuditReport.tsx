import { CheckCircle2, Gauge, XCircle } from 'lucide-react';
import type { AuditRecord } from '@/lib/audits';
import { formatDate } from '@/lib/usage';

interface AuditReportProps {
  audit: AuditRecord;
  removesWatermark: boolean;
  logoData: string | null;
}

function scoreTone(score: number) {
  if (score >= 90) return { text: 'text-emerald-600', stroke: 'text-emerald-500', verdict: 'Fast' };
  if (score >= 50) return { text: 'text-amber-600', stroke: 'text-amber-500', verdict: 'Needs work' };
  return { text: 'text-rose-600', stroke: 'text-rose-500', verdict: 'Slow' };
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function competitorGapText(audit: AuditRecord) {
  if (audit.review_count === null || audit.competitor_review_count === null) {
    return 'Not enough review data to compare.';
  }
  const gap = audit.competitor_review_count - audit.review_count;
  if (gap > 0) return `The top competitor has ${gap} more reviews than this business.`;
  if (gap < 0) return `This business leads the top competitor by ${Math.abs(gap)} reviews.`;
  return 'This business and the top competitor have the same number of reviews.';
}

export function AuditReport({ audit, removesWatermark, logoData }: AuditReportProps) {
  const tone = scoreTone(audit.pagespeed_score);
  const passedChecks = audit.seo_checks.filter((check) => check.passed).length;
  const businessName = audit.business_name ?? audit.target_url;

  return (
    <article
      id="audit-report"
      className="relative overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl shadow-black/40 print:rounded-none print:shadow-none"
    >
      <header className="flex flex-col gap-6 border-b border-slate-200 bg-slate-50 px-6 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-10">
        <div className="min-w-0">
          {removesWatermark && logoData ? (
            <img src={logoData} alt="Agency logo" className="h-10 max-w-[200px] object-contain object-left" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Gauge className="h-4 w-4 text-white" aria-hidden="true" />
              </span>
              <span className="font-semibold text-slate-900">AuditFlow SEO</span>
            </div>
          )}
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-indigo-600">Local SEO audit</p>
          <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">{businessName}</h2>
          <p className="mt-1 break-all text-sm text-slate-500">{audit.target_url}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xs uppercase tracking-wider text-slate-500">Generated</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(audit.created_at)}</p>
        </div>
      </header>

      <div className="space-y-10 px-6 py-8 sm:px-10">
        <section>
          <SectionTitle>PageSpeed and load time</SectionTitle>
          <div className="mt-5 grid grid-cols-1 items-center gap-8 sm:grid-cols-[auto_1fr]">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  className={tone.stroke}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - audit.pagespeed_score / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${tone.text}`}>{audit.pagespeed_score}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Score</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Verdict" value={tone.verdict} valueClass={tone.text} />
              <Stat label="Mobile load time" value={`${audit.mobile_load_time_s.toFixed(1)} s`} />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Google reviews and reputation</SectionTitle>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Stat label="Business rating" value={audit.review_rating === null ? 'No data' : `${audit.review_rating.toFixed(1)} / 5`} />
            <Stat label="Business reviews" value={audit.review_count === null ? 'No data' : String(audit.review_count)} />
            <Stat
              label="Top competitor"
              value={
                audit.competitor_rating === null || audit.competitor_review_count === null
                  ? 'No data'
                  : `${audit.competitor_rating.toFixed(1)} / 5 (${audit.competitor_review_count})`
              }
            />
          </div>
          <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{competitorGapText(audit)}</p>
        </section>

        <section>
          <SectionTitle>SEO and local search checks</SectionTitle>
          <p className="mt-2 text-sm text-slate-500">
            {passedChecks} of {audit.seo_checks.length} checks passed
          </p>
          <ul className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {audit.seo_checks.map((check) => (
              <li key={check.label} className="flex items-start justify-between gap-4 px-4 py-3.5">
                <div className="flex min-w-0 items-start gap-3">
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Passed" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-label="Failed" />
                  )}
                  <span className="text-sm font-medium text-slate-800">{check.label}</span>
                </div>
                <span className="shrink-0 text-right text-sm text-slate-500">{check.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-500 sm:px-10">
        <span>Prepared with AuditFlow SEO</span>
        <span>{audit.target_kind === 'google_maps' ? 'Google Maps listing' : 'Website audit'}</span>
      </footer>

      {!removesWatermark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span
            className="whitespace-nowrap text-5xl font-black uppercase tracking-[0.3em] text-slate-300/50"
            style={{ transform: 'rotate(-30deg)' }}
          >
            AuditFlow Free
          </span>
        </div>
      )}
    </article>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="border-l-4 border-indigo-600 pl-3 text-base font-semibold text-slate-900">{children}</h3>;
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold ${valueClass ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
