import { Gauge, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { AvatarCustomizer } from '@/components/dashboard/AvatarCustomizer';
import { useAuth, useProfile, type Profile } from '@/context/AuthContext';
import { PLAN_MAP } from '@/lib/plans';
import { supabase } from '@/lib/supabase';
import { Link } from '@/lib/router';

const MAX_LOGO_BYTES = 150 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AgencySettingsPage() {
  const profile = useProfile();
  const { setProfile } = useAuth();
  const [draft, setDraft] = useState<string | null>(profile.agency_logo_data);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const plan = PLAN_MAP[profile.plan];
  const dirty = draft !== profile.agency_logo_data;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setNotice(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Upload a PNG, JPG, WebP, or SVG image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('That image is larger than 150 KB. Try a smaller file.');
      return;
    }

    try {
      const dataUrl = await readAsDataUrl(file);
      setError(null);
      setDraft(dataUrl);
    } catch {
      setError('We could not read that file. Please try another image.');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ agency_logo_data: draft })
      .eq('user_id', profile.user_id)
      .select('user_id, agency_logo_data')
      .maybeSingle();

    setSaving(false);

    if (updateError || !data) {
      setError('We could not save your logo. Please try again.');
      return;
    }
    setProfile({ ...profile, agency_logo_data: (data as Profile).agency_logo_data });
    setNotice(draft ? 'Your logo is saved and will appear on new reports.' : 'Your logo has been removed.');
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Agency settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Brand your reports</h1>
        <p className="mt-2 text-slate-400">Your logo replaces the AuditFlow logo on the PDF reports you send to clients.</p>
      </div>

      {!plan.removesWatermark && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <p>Logos appear on Pro, Ultra, and Exclusive reports. Your {plan.name} reports keep the AuditFlow watermark.</p>
          <Link to="/dashboard/billing" className="shrink-0 font-semibold text-amber-200 underline-offset-4 hover:underline">
            View plans
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-white">Agency logo</h2>
            <p className="mt-1 text-sm text-slate-400">PNG, JPG, WebP, or SVG up to 150 KB. Transparent backgrounds work best.</p>
          </div>

          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6">
            {draft ? (
              <img src={draft} alt="Logo preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-sm text-slate-500">No logo uploaded yet</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-white/20 hover:bg-white/10">
              <ImagePlus className="h-4 w-4" />
              Choose image
              <input type="file" accept={ALLOWED_LOGO_TYPES.join(',')} onChange={handleFileChange} className="sr-only" />
            </label>
            {draft && (
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

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

          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Report header preview</h2>
          <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/40">
            {plan.removesWatermark && draft ? (
              <img src={draft} alt="" className="h-10 max-w-[200px] object-contain object-left" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <Gauge className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-900">AuditFlow SEO</span>
              </div>
            )}
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-indigo-600">Local SEO audit</p>
            <p className="mt-1 text-xl font-bold">Brightside Dental Care</p>
            <p className="mt-1 text-sm text-slate-500">brightsidedentalcare.com</p>
          </div>
          <p className="text-xs text-slate-500">
            The preview shows how your header looks on Pro and higher plans.
          </p>
        </section>
      </div>

      <AvatarCustomizer />
    </div>
  );
}
