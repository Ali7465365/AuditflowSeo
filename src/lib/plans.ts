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
    audience: 'Beginner freelancers testing the tool',
    features: [
      'Standard PDF reports',
      'Basic site speed checks',
      'Standard support',
      'AuditFlow watermark on reports',
    ],
    removesWatermark: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15.99,
    rank: 1,
    auditLimit: 25,
    audience: 'Active solo marketers',
    features: [
      'White-label PDF reports with no watermark',
      'Your agency logo on reports',
      'Priority speed checks',
      'Email support',
    ],
    removesWatermark: true,
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
      'Google Reviews competitor analysis',
      'Bulk URL batch audits',
      'Custom color themes on PDFs',
      'Priority support',
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
    audience: 'Established marketing agencies and teams',
    features: [
      'Everything in Ultra',
      'Unlimited audits per month',
      'Multi-user team accounts (up to 5 seats)',
      'API access',
      '1-on-1 strategy calls',
      '24/7 dedicated support',
    ],
    removesWatermark: true,
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((plan) => [plan.id, plan])) as Record<PlanId, Plan>;

export function formatPrice(price: number) {
  return price === 0 ? '$0' : `$${price.toFixed(2)}`;
}
