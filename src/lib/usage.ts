import type { Profile } from '@/context/AuthContext';
import { PLAN_MAP } from '@/lib/plans';

export interface UsageSummary {
  used: number;
  limit: number | null;
  remaining: number | null;
  percent: number;
  nextBilling: Date;
}

export function getUsage(profile: Profile): UsageSummary {
  const limit = PLAN_MAP[profile.plan].auditLimit;

  const periodEnd = new Date(profile.period_start);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const now = new Date();
  let used = profile.audits_used;
  let nextBilling = periodEnd;

  if (now >= periodEnd) {
    used = 0;
    nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  }

  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    percent: limit === null ? 0 : Math.min(100, (used / limit) * 100),
    nextBilling,
  };
}

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
