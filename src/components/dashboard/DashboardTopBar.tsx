import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { useAuth, useProfile, DEFAULT_AVATAR_STYLE, type AvatarStyle } from '@/context/AuthContext';
import { PLAN_MAP } from '@/lib/plans';
import { avatarClasses, avatarInitial } from '@/lib/avatar';
import { useRouter } from '@/lib/router';

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const profile = useProfile();
  const { signOut } = useAuth();
  const { navigate } = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const plan = PLAN_MAP[profile.plan];
  const avatarStyle: AvatarStyle = profile.avatar_style ?? DEFAULT_AVATAR_STYLE;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span
          className="rounded-full bg-indigo-600/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 ring-1 ring-inset ring-indigo-500/40"
          aria-label={`Current plan: ${plan.name}`}
        >
          {plan.name} Plan
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden w-56 md:block">
          <UsageBar profile={profile} />
        </div>

        <div className="flex items-center gap-2.5">
          <span className={avatarClasses(avatarStyle, 'h-9 w-9 text-sm')} aria-hidden="true">
            {avatarInitial(profile.email)}
          </span>
          <span className="hidden max-w-[180px] truncate text-sm text-slate-300 lg:inline">
            {profile.email}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
