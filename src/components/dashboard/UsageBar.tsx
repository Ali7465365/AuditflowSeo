import type { Profile } from '@/context/AuthContext';
import { getUsage } from '@/lib/usage';

interface UsageBarProps {
  profile: Profile;
}

export function UsageBar({ profile }: UsageBarProps) {
  const usage = getUsage(profile);

  if (usage.limit === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span>{usage.used} Audits Used</span>
          <span className="text-indigo-300">Unlimited</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
        </div>
      </div>
    );
  }

  const barColor = usage.percent >= 100 ? 'bg-rose-500' : usage.percent >= 80 ? 'bg-amber-400' : 'bg-indigo-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-slate-300">
        <span>
          {usage.used} / {usage.limit} Audits Used
        </span>
        <span className="text-slate-500">{usage.remaining} left</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.used}
        aria-label="Audit usage"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usage.percent}%` }} />
      </div>
    </div>
  );
}
