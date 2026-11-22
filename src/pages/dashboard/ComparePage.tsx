import { GitCompare, Printer, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/context/AuthContext';
import { type AuditRecord, computeOverallScore } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP } from '@/lib/plans';
import { formatDate } from '@/lib/usage';
import { Link } from '@/lib/router';

const AUDIT_COLUMNS =
  'id, target_url, target_kind, business_name, pagespeed_score, mobile_load_time_s, review_rating, review_count, competitor_rating, competitor_review_count, seo_checks, created_at, is_published, published_at, is_share_enabled, share_token, client_tag';

interface Pick {
  id: string;
  label: string;
}

export function ComparePage() {
  const profile = useProfile();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plan = PLAN_MAP[profile.plan];
  const isPro = plan.rank >= 1;
  const isUltra = plan.rank >= 2;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: loadError } = await supabase
        .from('audits')
        .select(AUDIT_COLUMNS)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (loadError) {
        setError('Could not load your audits. Please refresh.');
        setLoading(false);
        return;
      }
      setAudits((data as AuditRecord[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const auditA = useMemo(() => audits.find((a) => a.id === aId) ?? null, [audits, aId]);
  const auditB = useMemo(() => audits.find((a) => a.id === bId) ?? null, [audits, bId]);

  function labelOf(audit: AuditRecord) {
    return `${audit.business_name ?? audit.target_url} — ${formatDate(audit.created_at)}`;
  }

  function options(): Pick[] {
    return audits.map((a) => ({ id: a.id, label: labelOf(a) }));
  }

  const delta = useMemo(() => {
    if (!auditA || !auditB) return null;
    const overallA = computeOverallScore(auditA);
    const overallB = computeOverallScore(auditB);
    const checksImproved = auditB.seo_checks.filter((b) => !b.passed && auditA.seo_checks.find((x) => x.id === b.id)?.passed === true).length;
    const checksWorsened = auditB.seo_checks.filter((b) => b.passed && auditA.seo_checks.find((x) => x.id === b.id)?.passed === false).length;
    const wins = auditB.seo_checks.filter((b) => b.passed && auditA.seo_checks.find((x) => x.id === b.id)?.passed === false);
    const losses = auditB.seo_checks.filter((b) => !b.passed && auditA.seo_checks.find((x) => x.id === b.id)?.passed === true);
    return {
      overallDelta: overallB - overallA,
      overallA,
      overallB,
      pagespeedDelta: auditB.pagespeed_score - auditA.pagespeed_score,
      loadDelta: Number((auditB.mobile_load_time_s - auditA.mobile_load_time_s).toFixed(1)),
      reviewsDelta: auditA.review_count !== null && auditB.review_count !== null ? auditB.review_count - auditA.review_count : null,
      checksImproved,
      checksWorsened,
      wins,
      losses,
    };
  }, [auditA, auditB]);

  if (loading) {
    return <p className="py-20 text-center text-slate-400">Loading your audits...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
          <GitCompare className="h-4 w-4" aria-hidden="true" /> Compare
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Before vs after</h1>
        <p className="mt-2 text-slate-400">Pick two of your audits to show the client exactly what improved since the first run.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      {audits.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">You need at least two audits</p>
          <p className="mt-2 text-slate-400">Run an audit now, come back later, and compare the progress.</p>
          <Link to="/dashboard/new" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            New audit
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector label="Before (older audit)" value={aId} onChange={setAId} options={options(bId)} placeholder="Select audit A" />
            <Selector label="After (newer audit)" value={bId} onChange={setBId} options={options(aId)} placeholder="Select audit B" />
          </div>

          {delta && auditA && auditB && (
            <>
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center sm:p-8 print:border-slate-200">
                <p className={`text-5xl font-black tracking-tight ${delta.overallDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {delta.overallDelta >= 0 ? `+${delta.overallDelta}` : delta.overallDelta} points
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  overall score change · {delta.overallA} → {delta.overallB}
                </p>
                <div className="mt-6 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                  <Delta label="PageSpeed" value={delta.pagespeedDelta} suffix="/100" />
                  <Delta label="Load time" value={-delta.loadDelta} suffix="s" decimal />
                  <Delta label="Checks improved" value={delta.checksImproved} raw />
                  <Delta label="Checks worsened" value={delta.checksWorsened} raw invert />
                  {delta.reviewsDelta !== null && <Delta label="Reviews" value={delta.reviewsDelta} raw />}
                </div>
              </section>

              <div className="grid gap-6 sm:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 print:border-slate-200">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Trophy className="h-4 w-4 text-emerald-400" /> Top wins
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {delta.wins.length === 0 ? <li className="text-slate-500">No newly fixed checks yet.</li> : delta.wins.map((c) => <li key={c.id}>✓ {c.label}</li>)}
                  </ul>
                </section>
                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 print:border-slate-200">
                  <h2 className="text-sm font-semibold text-white">Remaining issues</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {delta.losses.length === 0 ? <li className="text-slate-500">Nothing regressed. Great work.</li> : delta.losses.map((c) => <li key={c.id}>• {c.label}</li>)}
                  </ul>
                </section>
              </div>

              {isUltra && auditB.competitor_review_count !== null && auditB.review_count !== null && (
                <p className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
                  Competitor note: the top competitor holds {Math.max(0, auditB.competitor_review_count - auditB.review_count)} more reviews than{' '}
                  {auditB.business_name ?? auditB.target_url}. Keep building review velocity to close the gap.
                </p>
              )}

              <div className="print:hidden">
                {isPro ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 sm:w-auto sm:px-8"
                  >
                    <Printer className="h-4 w-4" />
                    Download comparison PDF
                  </button>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Comparison PDF download is on Pro.{' '}
                    <Link to="/dashboard/billing" className="font-semibold text-amber-200 underline-offset-4 hover:underline">View plans</Link>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Selector({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: Pick[]; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Delta({ label, value, suffix, decimal, raw, invert }: { label: string; value: number; suffix?: string; decimal?: boolean; raw?: boolean; invert?: boolean }) {
  const good = invert ? value <= 0 : value >= 0;
  const tone = value === 0 ? 'text-slate-300' : good ? 'text-emerald-400' : 'text-rose-400';
  const display = raw ? `${value >= 0 ? '+' : ''}${value}` : `${value >= 0 ? '+' : ''}${decimal ? value.toFixed(1) : value}${suffix ?? ''}`;
  return (
    <div className="rounded-xl bg-slate-950/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{display}</p>
    </div>
  );
}
