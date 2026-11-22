import { ArrowLeft, Check, Eye, EyeOff, Link2, Loader2, Printer, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuditReport } from '@/components/report/AuditReport';
import { useProfile } from '@/context/AuthContext';
import { type AuditRecord } from '@/lib/audits';
import { supabase } from '@/lib/supabase';
import { PLAN_MAP } from '@/lib/plans';
import { buildClientMessage, buildDeveloperChecklist, buildProposalSnippet } from '@/lib/reportText';
import { Link, useRouter } from '@/lib/router';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; audit: AuditRecord };

interface AuditResultPageProps {
  auditId: string;
}

const AUDIT_COLUMNS =
  'id, target_url, target_kind, business_name, pagespeed_score, mobile_load_time_s, review_rating, review_count, competitor_rating, competitor_review_count, seo_checks, created_at, is_published, published_at, is_share_enabled, share_token, client_tag';

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function useCopyFlash() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }
  return { copied, copy };
}

export function AuditResultPage({ auditId }: AuditResultPageProps) {
  const profile = useProfile();
  const { search, pathname, navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopyFlash();
  const autoDownload = new URLSearchParams(search).get('download') === '1';

  useEffect(() => {
    let active = true;

    (async () => {
      setState({ status: 'loading' });
      const { data, error: loadError } = await supabase
        .from('audits')
        .select(AUDIT_COLUMNS)
        .eq('id', auditId)
        .maybeSingle();

      if (!active) return;
      if (loadError) {
        setState({ status: 'error' });
      } else if (!data) {
        setState({ status: 'missing' });
      } else {
        setState({ status: 'ready', audit: data as AuditRecord });
      }
    })();

    return () => {
      active = false;
    };
  }, [auditId]);

  const isReady = state.status === 'ready';

  useEffect(() => {
    if (!isReady || !autoDownload) return;
    const timer = window.setTimeout(() => {
      window.print();
      navigate(pathname, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [isReady, autoDownload, pathname, navigate]);

  const plan = PLAN_MAP[profile.plan];
  const isPro = plan.rank >= 1;
  const isUltra = plan.rank >= 2;

  function shareUrl(audit: AuditRecord) {
    return audit.share_token ? `${window.location.origin}/share/${audit.share_token}` : null;
  }

  async function patchAudit(fields: Partial<AuditRecord>, successMessage: string, busyKey: string) {
    if (state.status !== 'ready') return;
    setBusy(busyKey);
    setNotice(null);
    setError(null);

    const { data, error: updateError } = await supabase
      .from('audits')
      .update(fields)
      .eq('id', auditId)
      .select(AUDIT_COLUMNS)
      .maybeSingle();

    setBusy(null);

    if (updateError || !data) {
      setError('That action failed. Please try again.');
      return;
    }
    setState({ status: 'ready', audit: data as AuditRecord });
    setNotice(successMessage);
  }

  async function handleToggleShare() {
    if (state.status !== 'ready') return;
    const audit = state.audit;
    if (audit.is_share_enabled) {
      await patchAudit({ is_share_enabled: false }, 'Sharing is now off. The old link no longer works.', 'share');
      return;
    }
    const token = audit.share_token ?? randomToken();
    await patchAudit({ is_share_enabled: true, share_token: token }, 'Sharing is on. Copy the link below to send it to your client.', 'share');
  }

  async function handleTogglePublish() {
    if (state.status !== 'ready') return;
    const audit = state.audit;
    const willPublish = !audit.is_published;
    await patchAudit(
      { is_published: willPublish, published_at: willPublish ? new Date().toISOString() : null },
      willPublish ? 'This audit is now published to the public feed.' : 'This audit has been removed from the public feed.',
      'publish',
    );
  }

  function handleCopyChecklist() {
    if (state.status !== 'ready') return;
    void copy('checklist', buildDeveloperChecklist(state.audit));
  }

  function handleCopyClientMessage() {
    if (state.status !== 'ready') return;
    const url = state.audit.is_share_enabled ? shareUrl(state.audit) : null;
    void copy('client', buildClientMessage(state.audit, url, profile.agency_name));
  }

  function handleCopyProposal() {
    if (state.status !== 'ready') return;
    void copy('proposal', buildProposalSnippet(state.audit));
  }

  function handleCopyShareLink() {
    if (state.status !== 'ready') return;
    const url = shareUrl(state.audit);
    if (url) void copy('sharelink', url);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link to="/dashboard/saved" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Saved audits
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Audit results</h1>
        </div>
        {isReady && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={busy === 'publish'}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                state.audit.is_published
                  ? 'border-rose-500/40 text-rose-200 hover:bg-rose-500/10'
                  : 'border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : state.audit.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {state.audit.is_published ? 'Unpublish' : 'Publish to Feed'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 print:hidden">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 print:hidden">
          {notice}
        </p>
      )}

      {state.status === 'loading' && <p className="py-20 text-center text-slate-400">Loading audit...</p>}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          We could not load this audit. Please refresh the page and try again.
        </p>
      )}

      {state.status === 'missing' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">This audit could not be found</p>
          <p className="mt-2 text-slate-400">It may have been removed, or the link is incorrect.</p>
          <Link to="/dashboard/saved" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Back to saved audits
          </Link>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 print:hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">Shareable client link</p>
                  <p className="text-xs text-slate-400">
                    {state.audit.is_share_enabled
                      ? 'Anyone with this link can view a read-only report.'
                      : 'Turn on sharing to send a read-only link to your client.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleShare}
                disabled={busy === 'share'}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  state.audit.is_share_enabled
                    ? 'border-rose-500/40 text-rose-200 hover:bg-rose-500/10'
                    : 'border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/10'
                }`}
              >
                {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {state.audit.is_share_enabled ? 'Disable sharing' : 'Enable sharing'}
              </button>
            </div>

            {state.audit.is_share_enabled && state.audit.share_token && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  readOnly
                  value={shareUrl(state.audit) ?? ''}
                  onFocus={(event) => event.target.select()}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {copied === 'sharelink' ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {copied === 'sharelink' ? 'Copied' : 'Copy link'}
                </button>
              </div>
            )}
            {!isPro && (
              <p className="mt-3 text-xs text-slate-500">
                Free shared pages show a small "Generated with AuditFlow SEO" badge.{' '}
                <Link to="/dashboard/billing" className="font-semibold text-indigo-400 hover:text-indigo-300">Upgrade to Pro</Link>{' '}
                to remove it.
              </p>
            )}
          </section>

          <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            <CopyButton label="Copy developer checklist" copied={copied === 'checklist'} onClick={handleCopyChecklist} />
            <CopyButton label="Copy client message" copied={copied === 'client'} onClick={handleCopyClientMessage} />
            {isUltra ? (
              <CopyButton label="Copy proposal snippet" copied={copied === 'proposal'} onClick={handleCopyProposal} />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice('Proposal snippets are on Ultra. Upgrade to generate a short sales paragraph from any audit.');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/40 px-4 py-3 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/10"
              >
                Proposal snippet — Ultra
              </button>
            )}
          </section>

          <AuditReport
            audit={state.audit}
            removesWatermark={plan.removesWatermark}
            logoData={profile.agency_logo_data}
            planId={plan.id}
            brandColor={profile.brand_color}
            agencyName={profile.agency_name}
          />
        </>
      )}
    </div>
  );
}

function CopyButton({ label, copied, onClick }: { label: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all hover:border-indigo-500/40 hover:bg-indigo-600/10"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4 text-indigo-400" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
