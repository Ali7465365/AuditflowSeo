import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useProfile, DEFAULT_AVATAR_STYLE, type AvatarStyle, type Profile } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  AVATAR_BG_OPTIONS,
  AVATAR_FONT_OPTIONS,
  AVATAR_GRADIENT_OPTIONS,
  AVATAR_RING_OPTIONS,
  AVATAR_SHAPE_OPTIONS,
  AVATAR_SIZE_OPTIONS,
  AVATAR_TEXT_OPTIONS,
  avatarClasses,
  avatarInitial,
} from '@/lib/avatar';

export function AvatarCustomizer() {
  const profile = useProfile();
  const { setProfile } = useAuth();
  const [draft, setDraft] = useState<AvatarStyle>(profile.avatar_style ?? DEFAULT_AVATAR_STYLE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile.avatar_style ?? DEFAULT_AVATAR_STYLE);

  function update<K extends keyof AvatarStyle>(key: K, value: AvatarStyle[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setNotice(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_style: draft })
      .eq('user_id', profile.user_id)
      .select('user_id, email, plan, audits_used, period_start, agency_logo_data, avatar_style')
      .maybeSingle();

    setSaving(false);

    if (updateError || !data) {
      setError('We could not save your avatar style. Please try again.');
      return;
    }
    setProfile(data as Profile);
    setNotice('Your avatar style is saved.');
  }

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Dashboard avatar</h2>
        <p className="mt-1 text-sm text-slate-400">Pick a background, shape, ring, size, and font for the avatar shown in the top bar.</p>
      </div>

      <div className="flex items-center justify-center rounded-xl border border-white/5 bg-slate-950/60 py-8">
        <span className={avatarClasses(draft)}>{avatarInitial(profile.email)}</span>
      </div>

      <div className="space-y-5">
        <OptionGroup label="Background color">
          {AVATAR_BG_OPTIONS.map((opt) => (
            <SwatchButton
              key={opt.id}
              label={opt.label}
              active={draft.bg === opt.id && (draft.gradient ?? 'none') === 'none'}
              onClick={() => update('gradient', 'none') || update('bg', opt.id)}
            >
              <span className={`h-5 w-5 rounded-full ${opt.class}`} />
            </SwatchButton>
          ))}
        </OptionGroup>

        <OptionGroup label="Gradient">
          {AVATAR_GRADIENT_OPTIONS.map((opt) => (
            <SwatchButton
              key={opt.id}
              label={opt.label}
              active={draft.gradient === opt.id}
              onClick={() => update('gradient', opt.id as AvatarStyle['gradient'])}
            >
              <span className={`h-5 w-5 rounded-full ${opt.class || 'bg-slate-700'}`} />
            </SwatchButton>
          ))}
        </OptionGroup>

        <OptionGroup label="Text color">
          {AVATAR_TEXT_OPTIONS.map((opt) => (
            <PillButton key={opt.id} label={opt.label} active={draft.text === opt.id} onClick={() => update('text', opt.id)} />
          ))}
        </OptionGroup>

        <OptionGroup label="Shape">
          {AVATAR_SHAPE_OPTIONS.map((opt) => (
            <PillButton key={opt.id} label={opt.label} active={draft.shape === opt.id} onClick={() => update('shape', opt.id)} />
          ))}
        </OptionGroup>

        <OptionGroup label="Border / ring">
          {AVATAR_RING_OPTIONS.map((opt) => (
            <PillButton key={opt.id} label={opt.label} active={draft.ring === opt.id} onClick={() => update('ring', opt.id)} />
          ))}
        </OptionGroup>

        <OptionGroup label="Size">
          {AVATAR_SIZE_OPTIONS.map((opt) => (
            <PillButton key={opt.id} label={opt.label} active={draft.size === opt.id} onClick={() => update('size', opt.id)} />
          ))}
        </OptionGroup>

        <OptionGroup label="Letter style">
          {AVATAR_FONT_OPTIONS.map((opt) => (
            <PillButton key={opt.id} label={opt.label} active={draft.font === opt.id} onClick={() => update('font', opt.id)} />
          ))}
        </OptionGroup>

        <OptionGroup label="Soft shadow">
          <PillButton label={draft.shadow ? 'On' : 'Off'} active={draft.shadow} onClick={() => update('shadow', !draft.shadow)} />
        </OptionGroup>
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
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save avatar
      </button>
    </section>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SwatchButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
        active ? 'border-indigo-500 bg-indigo-600/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function PillButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active ? 'bg-indigo-600 text-white' : 'border border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );
}
