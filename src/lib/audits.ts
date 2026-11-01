export type TargetKind = 'website' | 'google_maps';

export interface SeoCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface AuditRecord {
  id: string;
  target_url: string;
  target_kind: TargetKind;
  business_name: string | null;
  pagespeed_score: number;
  mobile_load_time_s: number;
  review_rating: number | null;
  review_count: number | null;
  competitor_rating: number | null;
  competitor_review_count: number | null;
  seo_checks: SeoCheck[];
  created_at: string;
}

export type AuditPayload = Omit<AuditRecord, 'id' | 'created_at'>;

export const AUDIT_STEPS = ['Crawling page...', 'Checking PageSpeed...', 'Generating PDF...'];

function hashString(input: string) {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function readBusinessName(input: string, kind: TargetKind) {
  if (kind === 'google_maps') {
    const match = input.match(/\/place\/([^/@?]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim() || 'Google Maps listing';
    }
    return 'Google Maps listing';
  }
  try {
    return new URL(input).hostname.replace(/^www\./, '');
  } catch {
    return input;
  }
}

export function buildAuditPayload(input: string, kind: TargetKind): AuditPayload {
  const random = createRandom(hashString(input.trim().toLowerCase()));

  const seoPlan: Array<{ label: string; detail: [string, string] }> = [
    { label: 'Title tag', detail: ['Present and within length', 'Missing or too long'] },
    { label: 'Meta description', detail: ['Present and descriptive', 'Missing or duplicated'] },
    { label: 'H1 heading', detail: ['One clear H1 found', 'No H1 or multiple H1s'] },
    { label: 'Image alt text', detail: ['All key images described', 'Several images lack alt text'] },
    { label: 'Mobile viewport', detail: ['Responsive viewport set', 'Viewport tag missing'] },
    { label: 'Local business schema', detail: ['LocalBusiness markup found', 'No structured business data'] },
    { label: 'Google Business Profile linked', detail: ['Profile link detected', 'No profile link on page'] },
    { label: 'NAP consistency', detail: ['Name, address, phone consistent', 'Contact details inconsistent'] },
  ];

  const seoChecks: AuditPayload['seo_checks'] = seoPlan.map((check) => {
    const passed = random() > 0.3;
    return { label: check.label, passed, detail: passed ? check.detail[0] : check.detail[1] };
  });

  return {
    target_url: input.trim(),
    target_kind: kind,
    business_name: readBusinessName(input.trim(), kind),
    pagespeed_score: 38 + Math.floor(random() * 61),
    mobile_load_time_s: round1(1.1 + random() * 5.4),
    review_rating: round1(Math.min(5, 3.4 + random() * 1.6)),
    review_count: 8 + Math.floor(random() * 420),
    competitor_rating: round1(Math.min(5, 3.8 + random() * 1.2)),
    competitor_review_count: 40 + Math.floor(random() * 600),
    seo_checks: seoChecks,
  };
}

export const SAMPLE_AUDIT: AuditRecord = {
  id: 'sample',
  target_url: 'https://brightsidedentalcare.com',
  target_kind: 'website',
  business_name: 'Brightside Dental Care',
  pagespeed_score: 72,
  mobile_load_time_s: 3.4,
  review_rating: 4.6,
  review_count: 128,
  competitor_rating: 4.8,
  competitor_review_count: 412,
  seo_checks: [
    { label: 'Title tag', passed: true, detail: 'Present and within length' },
    { label: 'Meta description', passed: false, detail: 'Missing or duplicated' },
    { label: 'H1 heading', passed: true, detail: 'One clear H1 found' },
    { label: 'Image alt text', passed: false, detail: 'Several images lack alt text' },
    { label: 'Mobile viewport', passed: true, detail: 'Responsive viewport set' },
    { label: 'Local business schema', passed: false, detail: 'No structured business data' },
    { label: 'Google Business Profile linked', passed: true, detail: 'Profile link detected' },
    { label: 'NAP consistency', passed: true, detail: 'Name, address, phone consistent' },
  ],
  created_at: '2026-10-28T10:00:00.000Z',
};
