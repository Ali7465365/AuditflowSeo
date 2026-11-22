import { Loader2, Mail, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useProfile } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { isTempEmail } from '@/lib/emailValidation';
import { LockedFeatureCard } from '@/components/dashboard/UpgradeGate';

interface TeamMember {
  id: string;
  owner_id: string;
  member_email: string;
  status: string;
  created_at: string;
}

const SEAT_LIMIT = 5;

export function TeamSection() {
  const profile = useProfile();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = true;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, owner_id, member_email, status, created_at')
        .order('created_at', { ascending: true });
      if (active) {
        setMembers((data as TeamMember[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = invite.trim().toLowerCase();
    if (!email) return;
    if (isTempEmail(email)) {
      setError('Temporary emails are not allowed for team invites.');
      return;
    }
    if (members.length >= SEAT_LIMIT) {
      setError(`Your plan includes up to ${SEAT_LIMIT} seats.`);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    const { data, error: insertError } = await supabase
      .from('team_members')
      .insert({ owner_id: profile.user_id, member_email: email, status: 'invited' })
      .select('id, owner_id, member_email, status, created_at')
      .single();

    setBusy(false);
    setInvite('');
    if (insertError || !data) {
      setError('Could not send that invite. Please try again.');
      return;
    }
    setMembers((prev) => [...prev, data as TeamMember]);
    setNotice(`Invitation saved for ${email}. They can sign up with this email to join your workspace.`);
  }

  async function handleRemove(memberId: string) {
    const { error: deleteError } = await supabase.from('team_members').delete().eq('id', memberId);
    if (deleteError) {
      setError('Could not remove that member. Please try again.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading team...</p>;

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-semibold text-white">Team</h2>
        <p className="mt-1 text-sm text-slate-400">
          Exclusive plan: invite up to {SEAT_LIMIT} members. They can run audits on your plan limits and see agency audits.
        </p>
      </div>

      <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            placeholder="teammate@agency.com"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={busy || members.length >= SEAT_LIMIT}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Invite
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}

      {members.length === 0 ? (
        <LockedFeatureCard>
          <p className="text-sm font-medium text-slate-300">No team members yet</p>
          <p className="mt-1 text-sm text-slate-500">Invite your first teammate above.</p>
        </LockedFeatureCard>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{member.member_email}</p>
                <p className="text-xs capitalize text-slate-500">{member.status}</p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  aria-label={`Remove ${member.member_email}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
