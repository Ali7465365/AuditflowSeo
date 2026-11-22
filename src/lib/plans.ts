export type PlanId = 'free' | 'pro' | 'ultra' | 'exclusive';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  rank: number;
  auditLimit: number | null;
  audience: string;
  features: string[];
  removesWatermark: boolean;
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    rank: 0,
    auditLimit: 3,
    audience: 'Testing freelancers',
    features: [
      '3 audits / month',
      'Standard PDF with watermark',
      'Basic developer checklist',
      'Share link with AuditFlow badge',
      'Public Feed publishing',
      'On-screen compare only',
      'No brand color on PDF',
      'No team seats',
    ],
    removesWatermark: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15.99,
    rank: 1,
    auditLimit: 25,
    audience: 'Solo marketers / freelancers',
    features: [
      '25 audits / month',
      'White-label PDF (no watermark)',
      'Agency logo + brand color on PDF',
      'Clean share links (no badge)',
      'Full developer checklist + copy',
      'Comparison PDF download',
      'Priority recommendations',
      'Client message template button',
    ],
    removesWatermark: true,
    highlighted: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 25.99,
    rank: 2,
    auditLimit: 100,
    audience: 'Growing agencies',
    features: [
      'Everything in Pro',
      '100 audits / month',
      'Competitor gap block in report',
      'Deeper technical insights',
      'Custom PDF cover style',
      'Bulk export of checklist',
      'Proposal snippet generator',
      'High-priority revenue risk flags',
    ],
    removesWatermark: true,
    highlighted: true,
  },
  {
    id: 'exclusive',
    name: 'Exclusive',
    price: 35.99,
    rank: 3,
    auditLimit: null,
    audience: 'Teams / serious agencies',
    features: [
      'Everything in Ultra',
      'Unlimited audits',
      'Team seats up to 5',
      'Shared agency workspace',
      'Invite members by email',
      'Multi-client labeling (tags)',
      'Advanced competitor notes',
      'Priority support + API (coming soon)',
    ],
    removesWatermark: true,
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((plan) => [plan.id, plan])) as Record<PlanId, Plan>;

export function formatPrice(price: number) {
  return price === 0 ? '$0' : `$${price.toFixed(2)}`;
}
