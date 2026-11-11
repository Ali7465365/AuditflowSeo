import type { PlanId } from '@/lib/plans';
import type { AuditRecord, SeoCheck } from '@/lib/audits';
import { computeOverallScore } from '@/lib/audits';

export interface AssistantIntent {
  topic: string;
  response: string;
}

export interface AssistantContext {
  currentPlan?: PlanId;
  latestAudit?: AuditRecord | null;
}

const OUT_OF_SCOPE =
  'I only help with AuditFlow SEO: what the app is, who made it, how to use it, plans, and research on a URL you already audited.';

function failLines(checks: SeoCheck[]) {
  if (checks.length === 0) return 'None';
  return checks.map((c) => `• ${c.label} (${c.priority}): ${c.detail} — ${c.value}`).join('\n');
}

function researchForUrl(audit: AuditRecord): string {
  const overall = computeOverallScore(audit);
  const failed = audit.seo_checks.filter((c) => !c.passed);
  const high = failed.filter((c) => c.priority === 'high');
  const medium = failed.filter((c) => c.priority === 'medium');
  const low = failed.filter((c) => c.priority === 'low');

  const verdict =
    overall >= 90
      ? 'Strong URL. Keep polishing and growing reviews.'
      : overall >= 50
        ? 'Average URL. Fix high-priority issues first and the score can rise quickly.'
        : 'Weak URL. Start with high-priority technical and local SEO fixes.';

  const topFixes = high
    .slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.label} — ${c.detail}`)
    .join('\n');

  return [
    'Research on your tested URL:',
    `URL: ${audit.target_url}`,
    `Type: ${audit.target_kind === 'google_maps' ? 'Google Maps listing' : 'Website'}`,
    `Business: ${audit.business_name ?? 'N/A'}`,
    `Overall score: ${overall}/100`,
    `PageSpeed (mobile): ${audit.pagespeed_score}/100`,
    `Mobile load time: ${audit.mobile_load_time_s}s`,
    audit.review_rating != null
      ? `Reviews: ${audit.review_rating.toFixed(1)} (${audit.review_count ?? 0})`
      : 'Reviews: no data',
    '',
    `Failed checks: ${failed.length} of ${audit.seo_checks.length}`,
    '',
    'HIGH priority:',
    failLines(high),
    '',
    'MEDIUM priority:',
    failLines(medium),
    '',
    'LOW priority:',
    failLines(low),
    '',
    `Verdict: ${verdict}`,
    topFixes ? `\nFix first:\n${topFixes}` : '',
    '',
    'Re-run the same URL after fixes to confirm improvement.',
  ].join('\n');
}

function matchTopic(
  question: string,
): 'intro' | 'trust' | 'start' | 'url_research' | 'plans' | 'help' | 'out_of_scope' {
  const q = question.toLowerCase();
  if (!q.trim()) return 'help';

  if (/(what is|about the app|about auditflow|who made|who built|creator|aoun|developer of)/.test(q)) {
    return 'intro';
  }
  if (/(trust|safe|privacy|data|secure|should i use)/.test(q)) return 'trust';
  if (
    /(https?:\/\/|this url|my url|research|analyze|report|score|pagespeed|fix|improve|failed|what should i fix|overall score)/.test(
      q,
    )
  ) {
    return 'url_research';
  }
  if (/(how.*(use|start|run)|new audit|guide|tutorial)/.test(q)) return 'start';
  if (/(plan|pricing|free|pro|ultra|exclusive|upgrade|price)/.test(q)) return 'plans';
  if (/(hello|hi|hey|help|what can you|who are you)/.test(q)) return 'help';
  return 'out_of_scope';
}

export function generateAssistantResponse(
  question: string,
  context: AssistantContext = {},
): AssistantIntent {
  const topic = matchTopic(question);
  const audit = context.latestAudit ?? null;

  switch (topic) {
    case 'intro':
      return {
        topic: 'About AuditFlow SEO',
        response: [
          'AuditFlow SEO is a SaaS tool for local business audits.',
          'What it does: you paste a website URL or Google Maps link, and it checks speed, reviews/reputation signals, and SEO basics, then builds a clear PDF report.',
          'Who made it: Syed Muhammad Aoun, full-stack developer from Pakistan.',
          'Who it is for: freelancers, solo marketers, and agencies who need fast client-ready audit reports.',
        ].join('\n'),
      };

    case 'trust':
      return {
        topic: 'Trust and data',
        response: [
          'Should you use it? Yes, if you need quick local SEO audit reports for clients.',
          'Your audits are tied to your logged-in account and are not shown as a public feed.',
          'Only audit URLs you are allowed to check.',
          'Treat report scores as a practical checklist from the app’s audit rules, not a legal guarantee.',
        ].join('\n'),
      };

    case 'start':
      return {
        topic: 'How to use the app',
        response: [
          '1. Open New Audit.',
          '2. Paste a website URL or Google Maps link.',
          '3. Click Run audit.',
          '4. Open the report and download PDF if needed.',
          '5. Ask me “research this URL” and I will explain the results.',
        ].join('\n'),
      };

    case 'url_research':
      if (!audit) {
        return {
          topic: 'URL research',
          response:
            'No recent audit found. Run an audit on New Audit first, then ask me to research that URL.',
        };
      }
      return {
        topic: 'URL research',
        response: researchForUrl(audit),
      };

    case 'plans':
      return {
        topic: 'Plans',
        response: [
          'Free: testing, limited audits, standard PDF.',
          'Pro: more audits, white-label PDF.',
          'Ultra: higher limits + deeper insights.',
          'Exclusive: highest limits / team-focused use.',
          context.currentPlan ? `You are currently on: ${context.currentPlan}` : '',
          'Change plans from Plan & Billing.',
        ]
          .filter(Boolean)
          .join('\n'),
      };

    case 'help':
      return {
        topic: 'AuditFlow AI',
        response: [
          'I can help with:',
          '• What AuditFlow SEO is and who made it',
          '• Whether you should use it and how data works',
          '• How to run an audit',
          '• Research on a URL you already tested',
          '• Which plan fits your work',
        ].join('\n'),
      };

    default:
      return { topic: 'Out of scope', response: OUT_OF_SCOPE };
  }
}