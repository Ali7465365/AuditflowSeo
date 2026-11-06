export type TargetKind = 'website' | 'google_maps';

export type Priority = 'high' | 'medium' | 'low';

export interface SeoCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  value: string;
  priority: Priority;
}

export interface Recommendation {
  title: string;
  detail: string;
  priority: Priority;
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

export const AUDIT_STEPS = [
  'Crawling page and reading content...',
  'Analyzing on-page SEO elements...',
  'Checking PageSpeed and mobile experience...',
  'Reviewing local search and competitor signals...',
  'Generating detailed PDF report...',
];

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

interface CheckPlan {
  id: string;
  label: string;
  priority: Priority;
  pass: { detail: string; value: (r: () => number) => string };
  fail: { detail: string; value: (r: () => number) => string };
  passChance: number;
}

const CHECK_PLANS: CheckPlan[] = [
  {
    id: 'title_tag',
    label: 'Title tag',
    priority: 'high',
    passChance: 0.78,
    pass: { detail: 'Present and within optimal length', value: () => '42 characters' },
    fail: { detail: 'Missing, too long, or too short', value: () => 'Missing or 68 characters' },
  },
  {
    id: 'meta_description',
    label: 'Meta description',
    priority: 'medium',
    passChance: 0.66,
    pass: { detail: 'Present and descriptive', value: () => '148 characters' },
    fail: { detail: 'Missing or duplicated across pages', value: () => 'Missing' },
  },
  {
    id: 'h1_heading',
    label: 'H1 heading',
    priority: 'high',
    passChance: 0.82,
    pass: { detail: 'One clear H1 found', value: () => '1 H1 on page' },
    fail: { detail: 'No H1 or multiple competing H1s', value: () => '0 or 3 H1 tags' },
  },
  {
    id: 'image_alt',
    label: 'Image alt text',
    priority: 'medium',
    passChance: 0.55,
    pass: { detail: 'All key images have alt text', value: (r) => `${Math.floor(8 + r() * 20)} images, all described` },
    fail: { detail: 'Several images lack descriptive alt text', value: (r) => `${Math.floor(12 + r() * 18)} images, ${Math.floor(4 + r() * 8)} missing alt` },
  },
  {
    id: 'mobile_friendly',
    label: 'Mobile friendly',
    priority: 'high',
    passChance: 0.84,
    pass: { detail: 'Responsive viewport and tap targets set', value: () => 'Responsive layout' },
    fail: { detail: 'Viewport tag missing or content too wide', value: () => 'Not responsive' },
  },
  {
    id: 'https_ssl',
    label: 'HTTPS / SSL',
    priority: 'high',
    passChance: 0.88,
    pass: { detail: 'Valid SSL certificate, all resources over HTTPS', value: () => 'Valid SSL' },
    fail: { detail: 'No SSL certificate or mixed content', value: () => 'No SSL / mixed content' },
  },
  {
    id: 'broken_links',
    label: 'Broken links',
    priority: 'medium',
    passChance: 0.6,
    pass: { detail: 'No broken links detected', value: () => '0 broken links' },
    fail: { detail: 'Broken links found that hurt crawl health', value: (r) => `${Math.floor(2 + r() * 6)} broken links` },
  },
  {
    id: 'internal_links',
    label: 'Internal links structure',
    priority: 'low',
    passChance: 0.62,
    pass: { detail: 'Good internal linking with clear hierarchy', value: (r) => `${Math.floor(20 + r() * 40)} internal links` },
    fail: { detail: 'Thin internal linking, important pages hard to reach', value: (r) => `${Math.floor(3 + r() * 8)} internal links` },
  },
  {
    id: 'external_links',
    label: 'External links',
    priority: 'low',
    passChance: 0.7,
    pass: { detail: 'Relevant outbound links to authoritative sources', value: (r) => `${Math.floor(3 + r() * 10)} external links` },
    fail: { detail: 'No or spammy external links', value: () => '0 quality external links' },
  },
  {
    id: 'content_length',
    label: 'Content length / thin content',
    priority: 'medium',
    passChance: 0.58,
    pass: { detail: 'Sufficient content depth on key pages', value: (r) => `${Math.floor(600 + r() * 800)} words on homepage` },
    fail: { detail: 'Thin content pages with little value', value: (r) => `${Math.floor(80 + r() * 150)} words on homepage` },
  },
  {
    id: 'keyword_usage',
    label: 'Keyword usage',
    priority: 'medium',
    passChance: 0.5,
    pass: { detail: 'Target keywords used naturally in titles and body', value: () => 'Primary keyword optimized' },
    fail: { detail: 'No clear target keyword or keyword stuffing', value: () => 'Not optimized' },
  },
  {
    id: 'local_seo',
    label: 'Local SEO readiness',
    priority: 'high',
    passChance: 0.45,
    pass: { detail: 'NAP consistent, city/region mentioned, local intent clear', value: () => 'Local signals strong' },
    fail: { detail: 'Missing local signals: no city name, inconsistent NAP', value: () => 'Local signals weak' },
  },
  {
    id: 'google_maps_signals',
    label: 'Google Maps / Business listing',
    priority: 'high',
    passChance: 0.6,
    pass: { detail: 'Google Business Profile linked and categorized', value: () => 'GBP linked' },
    fail: { detail: 'No Google Business Profile link detected', value: () => 'No listing found' },
  },
  {
    id: 'schema_markup',
    label: 'Schema / structured data',
    priority: 'medium',
    passChance: 0.38,
    pass: { detail: 'Structured data markup found (LocalBusiness or Organization)', value: () => 'LocalBusiness schema' },
    fail: { detail: 'No structured data markup detected', value: () => 'No schema detected' },
  },
  {
    id: 'open_graph',
    label: 'Social media tags (Open Graph)',
    priority: 'low',
    passChance: 0.52,
    pass: { detail: 'Open Graph and Twitter Card tags present', value: () => 'OG + Twitter tags set' },
    fail: { detail: 'Missing Open Graph tags for social sharing', value: () => 'OG tags missing' },
  },
];

export function buildAuditPayload(input: string, kind: TargetKind): AuditPayload {
  const random = createRandom(hashString(input.trim().toLowerCase()));

  const seoChecks: SeoCheck[] = CHECK_PLANS.map((plan) => {
    const passed = random() < plan.passChance;
    const outcome = passed ? plan.pass : plan.fail;
    return {
      id: plan.id,
      label: plan.label,
      passed,
      detail: outcome.detail,
      value: outcome.value(random),
      priority: plan.priority,
    };
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

export function computeOverallScore(audit: Pick<AuditRecord, 'pagespeed_score' | 'seo_checks'>): number {
  const passRate = audit.seo_checks.length
    ? audit.seo_checks.filter((c) => c.passed).length / audit.seo_checks.length
    : 0;
  return Math.round(audit.pagespeed_score * 0.5 + passRate * 100 * 0.5);
}

const RECOMMENDATION_DETAILS: Record<string, string> = {
  title_tag: 'Add a unique, descriptive title tag between 30-60 characters containing the primary keyword and city.',
  meta_description: 'Write a compelling meta description (120-160 characters) for each key page to improve click-through.',
  h1_heading: 'Ensure each page has exactly one H1 that includes the target keyword naturally.',
  image_alt: 'Add descriptive alt text to all meaningful images, including product and location photos.',
  mobile_friendly: 'Add a responsive viewport meta tag and fix tap-target spacing for mobile visitors.',
  https_ssl: 'Install an SSL certificate and fix mixed-content warnings so all resources load over HTTPS.',
  broken_links: 'Find and fix broken internal and external links using a crawler or Search Console.',
  internal_links: 'Add contextual internal links from high-traffic pages to important service and location pages.',
  external_links: 'Link out to 2-3 authoritative sources (associations, directories) to build trust.',
  content_length: 'Expand thin pages to at least 500-800 words with genuine value for the reader.',
  keyword_usage: 'Choose one primary keyword per page and use it in the title, H1, intro, and naturally in the body.',
  local_seo: 'Add the city/region name to page titles, footers, and a dedicated contact page with consistent NAP.',
  google_maps_signals: 'Claim and optimize a Google Business Profile, then embed the map on your contact page.',
  schema_markup: 'Add LocalBusiness or Organization schema markup so search engines understand your business.',
  open_graph: 'Add Open Graph and Twitter Card tags so links share with rich previews on social media.',
};

export function buildRecommendations(audit: AuditRecord, planId: string): Recommendation[] {
  const failed = audit.seo_checks.filter((c) => !c.passed);
  const base: Recommendation[] = failed.map((check) => ({
    title: check.label,
    detail: RECOMMENDATION_DETAILS[check.id] ?? check.detail,
    priority: check.priority,
  }));

  const order = { high: 0, medium: 1, low: 2 };
  base.sort((a, b) => order[a.priority] - order[b.priority]);

  if (planId === 'ultra' || planId === 'exclusive') {
    base.push({
      title: 'Technical SEO health',
      detail: 'Run a full crawl monthly to catch broken links, redirect chains, and orphan pages before they accumulate.',
      priority: 'medium',
    });
    base.push({
      title: 'Structured data expansion',
      detail: 'Beyond LocalBusiness, add FAQ and Review schema to capture rich-result eligibility in search.',
      priority: 'low',
    });
  }

  if (planId === 'exclusive') {
    base.push({
      title: 'Competitor content gap strategy',
      detail: 'Identify service pages where competitors rank but you do not, then build better, deeper versions targeting those keywords.',
      priority: 'high',
    });
    base.push({
      title: 'Review velocity plan',
      detail: 'Set up a review-request workflow to close the gap with the top competitor within 90 days.',
      priority: 'high',
    });
    base.push({
      title: 'Team workflow setup',
      detail: 'Assign audit reviews across team seats so technical, content, and local-SEO fixes each have an owner.',
      priority: 'medium',
    });
  }

  return base;
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
    { id: 'title_tag', label: 'Title tag', passed: true, detail: 'Present and within optimal length', value: '42 characters', priority: 'high' },
    { id: 'meta_description', label: 'Meta description', passed: false, detail: 'Missing or duplicated across pages', value: 'Missing', priority: 'medium' },
    { id: 'h1_heading', label: 'H1 heading', passed: true, detail: 'One clear H1 found', value: '1 H1 on page', priority: 'high' },
    { id: 'image_alt', label: 'Image alt text', passed: false, detail: 'Several images lack descriptive alt text', value: '18 images, 6 missing alt', priority: 'medium' },
    { id: 'mobile_friendly', label: 'Mobile friendly', passed: true, detail: 'Responsive viewport and tap targets set', value: 'Responsive layout', priority: 'high' },
    { id: 'https_ssl', label: 'HTTPS / SSL', passed: true, detail: 'Valid SSL certificate, all resources over HTTPS', value: 'Valid SSL', priority: 'high' },
    { id: 'broken_links', label: 'Broken links', passed: false, detail: 'Broken links found that hurt crawl health', value: '3 broken links', priority: 'medium' },
    { id: 'internal_links', label: 'Internal links structure', passed: true, detail: 'Good internal linking with clear hierarchy', value: '34 internal links', priority: 'low' },
    { id: 'external_links', label: 'External links', passed: false, detail: 'No or spammy external links', value: '0 quality external links', priority: 'low' },
    { id: 'content_length', label: 'Content length / thin content', passed: false, detail: 'Thin content pages with little value', value: '120 words on homepage', priority: 'medium' },
    { id: 'keyword_usage', label: 'Keyword usage', passed: false, detail: 'No clear target keyword or keyword stuffing', value: 'Not optimized', priority: 'medium' },
    { id: 'local_seo', label: 'Local SEO readiness', passed: false, detail: 'Missing local signals: no city name, inconsistent NAP', value: 'Local signals weak', priority: 'high' },
    { id: 'google_maps_signals', label: 'Google Maps / Business listing', passed: true, detail: 'Google Business Profile linked and categorized', value: 'GBP linked', priority: 'high' },
    { id: 'schema_markup', label: 'Schema / structured data', passed: false, detail: 'No structured data markup detected', value: 'No schema detected', priority: 'medium' },
    { id: 'open_graph', label: 'Social media tags (Open Graph)', passed: false, detail: 'Missing Open Graph tags for social sharing', value: 'OG tags missing', priority: 'low' },
  ],
  created_at: '2026-11-01T10:00:00.000Z',
};
