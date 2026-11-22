import type { AuditRecord, SeoCheck } from '@/lib/audits';
import { computeOverallScore } from '@/lib/audits';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function failedChecksSorted(audit: AuditRecord): SeoCheck[] {
  return audit.seo_checks
    .filter((c) => !c.passed)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function passedChecks(audit: AuditRecord): SeoCheck[] {
  return audit.seo_checks.filter((c) => c.passed);
}

export function buildExecutiveSummary(audit: AuditRecord): string[] {
  const overall = computeOverallScore(audit);
  const passed = passedChecks(audit).length;
  const total = audit.seo_checks.length;
  const failedHigh = failedChecksSorted(audit).filter((c) => c.priority === 'high');
  const lines: string[] = [];

  lines.push(
    overall >= 80
      ? `${audit.business_name ?? audit.target_url} is in strong shape with an overall score of ${overall}/100.`
      : overall >= 50
        ? `${audit.business_name ?? audit.target_url} has an overall score of ${overall}/100 — there is real room to grow.`
        : `${audit.business_name ?? audit.target_url} is leaving customers behind with an overall score of ${overall}/100.`,
  );
  lines.push(`${passed} of ${total} technical and local-SEO checks passed, and mobile PageSpeed scored ${audit.pagespeed_score}/100.`);

  if (passed > 0) {
    const strongest = passedChecks(audit).slice(0, 2).map((c) => c.label).join(' and ');
    lines.push(`What's strong: ${strongest} are already working in your favor.`);
  }

  if (failedHigh.length > 0) {
    lines.push(`What's weak: ${failedHigh.length} high-priority issue${failedHigh.length === 1 ? '' : 's'} need attention — ${failedHigh.slice(0, 2).map((c) => c.label).join(' and ')}${failedHigh.length > 2 ? ' and more' : ''}.`);
  } else {
    lines.push('No high-priority problems were found — the remaining fixes are quick wins.');
  }

  const top3 = failedChecksSorted(audit).slice(0, 3);
  if (top3.length > 0) {
    lines.push(`Top 3 actions: ${top3.map((c, i) => `(${i + 1}) ${c.label}`).join(', ')}.`);
  } else {
    lines.push('Top 3 actions: keep publishing reviews, refresh content quarterly, and monitor speed monthly.');
  }

  return lines;
}

export function buildDeveloperChecklist(audit: AuditRecord): string {
  const failed = failedChecksSorted(audit);
  if (failed.length === 0) {
    return `DEVELOPER FIX CHECKLIST — ${audit.business_name ?? audit.target_url}\n\nAll checks passed. No fixes required.`;
  }

  const lines = [`DEVELOPER FIX CHECKLIST — ${audit.business_name ?? audit.target_url}`, ''];

  let currentPriority = '';
  for (const check of failed) {
    const label = check.priority === 'high' ? 'HIGH PRIORITY' : check.priority === 'medium' ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
    if (label !== currentPriority) {
      lines.push(`— ${label} —`);
      currentPriority = label;
    }
    lines.push(`[ ] ${check.label}: ${check.detail}`);
    lines.push(`    Fix: ${recommendationFor(check)}`);
    lines.push('');
  }

  lines.push('Generated with AuditFlow SEO');
  return lines.join('\n');
}

function recommendationFor(check: SeoCheck): string {
  const FIXES: Record<string, string> = {
    title_tag: 'Write a unique 30-60 character title with the primary keyword and city.',
    meta_description: 'Add a 120-160 character meta description to every key page.',
    h1_heading: 'Use exactly one H1 per page containing the target keyword.',
    image_alt: 'Add descriptive alt text to all meaningful images.',
    mobile_friendly: 'Add a responsive viewport tag and fix tap-target spacing.',
    https_ssl: 'Install SSL and fix mixed-content warnings.',
    broken_links: 'Crawl the site and repair all broken links.',
    internal_links: 'Add contextual internal links to important service pages.',
    external_links: 'Link out to 2-3 authoritative external sources.',
    content_length: 'Expand thin pages to 500-800 words of real value.',
    keyword_usage: 'Use the primary keyword naturally in title, H1, and intro.',
    local_seo: 'Add city/region to titles, footers, and contact page with consistent NAP.',
    google_maps_signals: 'Claim and optimize the Google Business Profile and embed the map.',
    schema_markup: 'Add LocalBusiness or Organization schema markup.',
    open_graph: 'Add Open Graph and Twitter Card tags for social sharing.',
  };
  return FIXES[check.id] ?? check.detail;
}

export function buildClientMessage(audit: AuditRecord, shareUrl: string | null, agencyName: string | null): string {
  const overall = computeOverallScore(audit);
  const top3 = failedChecksSorted(audit).slice(0, 3);
  const business = audit.business_name ?? audit.target_url;
  const from = agencyName ? `\n\n— ${agencyName}` : '\n\n— Sent with AuditFlow SEO';

  const greeting = `Hi,\n\nI've completed a full local-SEO audit of ${business}. Here's the quick summary:`;
  const score = `\n\n• Overall score: ${overall}/100\n• Mobile PageSpeed: ${audit.pagespeed_score}/100\n• Mobile load time: ${audit.mobile_load_time_s.toFixed(1)}s`;
  const issues =
    top3.length > 0
      ? `\n\nTop issues to fix:\n${top3.map((c, i) => `${i + 1}. ${c.label} — ${c.detail}`).join('\n')}`
      : '\n\nGood news: no high-priority issues were found.';
  const link = shareUrl ? `\n\nFull report (no signup needed): ${shareUrl}` : '\n\nFull report is attached.';
  const cta = `\n\nWant me to handle these fixes and turn this score around? Happy to walk you through the plan.`;

  return greeting + score + issues + link + cta + from;
}

export function buildProposalSnippet(audit: AuditRecord): string {
  const overall = computeOverallScore(audit);
  const failedHigh = failedChecksSorted(audit).filter((c) => c.priority === 'high').length;
  const business = audit.business_name ?? audit.target_url;
  return `${business} currently scores ${overall}/100 on local search readiness, with ${failedHigh} high-priority issue${failedHigh === 1 ? '' : 's'} costing visibility in Google Maps and local search. Most of these fixes pay for themselves within weeks: better rankings bring more calls, more bookings, and more reviews. I can start with the highest-impact items this week and show measurable progress within 30 days.`;
}
