import type { PlanId } from '@/lib/plans';

export interface AssistantIntent {
  topic: string;
  response: string;
}

const PLAN_GUIDE = [
  {
    id: 'free' as PlanId,
    name: 'Free',
    fit: 'Beginners testing the tool',
    detail: '$0/mo, 3 audits per month, standard PDF reports with the AuditFlow watermark. Best if you are just exploring local SEO audits.',
  },
  {
    id: 'pro' as PlanId,
    name: 'Pro',
    fit: 'Solo marketers',
    detail: '$15.99/mo, 25 audits per month, white-label PDFs with your logo and no watermark, priority recommendations. Best for freelancers serving a few clients.',
  },
  {
    id: 'ultra' as PlanId,
    name: 'Ultra',
    fit: 'Growing agencies',
    detail: '$25.99/mo, 100 audits per month, everything in Pro plus competitor gap analysis, extra technical insights, and custom PDF colors. Best for agencies scaling up.',
  },
  {
    id: 'exclusive' as PlanId,
    name: 'Exclusive',
    fit: 'Big teams and agencies',
    detail: '$35.99/mo, unlimited audits, everything in Ultra plus advanced recommendations, deeper competitor analysis, multi-user team seats (up to 5), and API access. Best for established teams.',
  },
];

const OUT_OF_SCOPE =
  "I can only help with AuditFlow SEO and website audits. For anything else, please reach out to the right resource. Ask me how to run an audit, understand a report, improve a URL, or pick the right plan.";

const REPORT_SECTIONS = [
  { key: 'overall', title: 'Overall Score', text: 'A blended score from your PageSpeed score and how many of the SEO checks passed. 90+ is excellent, 50-89 needs work, below 50 is poor.' },
  { key: 'pagespeed', title: 'PageSpeed Score (Mobile)', text: 'How fast the page loads on a mobile connection. Faster pages rank better and keep visitors. Aim for 90+.' },
  { key: 'load', title: 'Page Load Time', text: 'The measured time to fully load on mobile. Under 2.5 seconds is good; over 4 seconds needs attention.' },
  { key: 'title', title: 'Title Tag', text: 'The page title shown in search results. Should be unique, 30-60 characters, and include the primary keyword and city.' },
  { key: 'meta', title: 'Meta Description', text: 'The summary under the search link. Should be 120-160 characters and describe the page to improve clicks.' },
  { key: 'h1', title: 'H1 Heading', text: 'The main on-page heading. Each page should have exactly one H1 with the target keyword.' },
  { key: 'alt', title: 'Image Alt Text', text: 'Text describing images for screen readers and search engines. Missing alt text is a lost SEO opportunity.' },
  { key: 'mobile', title: 'Mobile Friendly', text: 'Whether the page adapts to phone screens with a responsive viewport and tappable links.' },
  { key: 'https', title: 'HTTPS / SSL', text: 'A valid certificate encrypts the connection and is a ranking signal. Mixed content (some HTTP resources) should be fixed.' },
  { key: 'broken', title: 'Broken Links', text: 'Links that lead nowhere. They waste crawl budget and hurt user trust; fix or remove them.' },
  { key: 'internal', title: 'Internal Links', text: 'Links between your own pages. A clear hierarchy helps search engines and visitors find important pages.' },
  { key: 'external', title: 'External Links', text: 'Links to other websites. A few authoritative outbound links build trust; avoid spammy ones.' },
  { key: 'content', title: 'Content Length / Thin Content', text: 'Pages with very little text (under ~300 words) offer little value. Expand key pages to 500-800+ words.' },
  { key: 'keyword', title: 'Keyword Usage', text: 'Whether a clear target keyword appears in the title, H1, intro, and body naturally. Avoid stuffing.' },
  { key: 'local', title: 'Local SEO Readiness', text: 'Signals like the city/region name and consistent name-address-phone (NAP) that help you rank for local searches.' },
  { key: 'maps', title: 'Google Maps / Business Listing', text: 'A linked and optimized Google Business Profile is the single biggest local ranking factor.' },
  { key: 'schema', title: 'Schema / Structured Data', text: 'Code that tells search engines your business type (e.g. LocalBusiness). It unlocks rich results.' },
  { key: 'og', title: 'Social Media Tags (Open Graph)', text: 'Tags that control how your link looks when shared on social media. Missing tags mean blank previews.' },
  { key: 'competitor', title: 'Competitor Comparison', text: 'How this business stacks up against the top local competitor on reviews, content, and schema (Ultra and Exclusive).' },
  { key: 'recommendations', title: 'Final Recommendations', text: 'A prioritized list (High/Medium/Low) of fixes, sorted by impact. Work top-down.' },
];

const IMPROVE_TIPS = [
  'Fix every High-priority recommendation first — they have the biggest impact on rankings.',
  'Claim and optimize your Google Business Profile, then embed the map on your contact page.',
  'Add the city/region to your page titles, H1s, and footer for local search visibility.',
  'Add LocalBusiness schema markup so search engines understand your business type.',
  'Speed up the page: compress images, enable caching, and remove render-blocking scripts.',
  'Write unique title tags (30-60 chars) and meta descriptions (120-160 chars) per page.',
  'Ensure exactly one H1 per page that includes the target keyword.',
  'Add descriptive alt text to all meaningful images.',
  'Install SSL and fix any mixed-content (HTTP resources on an HTTPS page).',
  'Find and fix broken links with a crawler or Search Console.',
  'Expand thin pages to 500-800+ words with genuine value.',
  'Build a review-request workflow to grow Google reviews and close the competitor gap.',
];

function matchTopic(question: string): 'start' | 'report' | 'improve' | 'developer' | 'plans' | 'out_of_scope' | 'help' {
  const q = question.toLowerCase();
  if (!q.trim()) return 'help';

  if (/(how.*(use|start|run|begin)|step|guide|tutorial|new audit|create audit)/.test(q)) return 'start';
  if (/(report|score|pagespeed|load time|title tag|meta|h1|alt|mobile|https|ssl|broken link|internal|external|content|keyword|local seo|google maps|schema|structured|open graph|competitor|recommendation|priority|check|what does|what is|explain)/.test(q)) return 'report';
  if (/(improve|fix|better|increase|boost|rank|optimi[sz]e|recommend|action|repair|issue|problem|slow)/.test(q)) return 'improve';
  if (/(developer|webmaster|repairer|technic|code|html|css|js|javascript|implement|crawl|index|robot|sitemap)/.test(q)) return 'developer';
  if (/(plan|pricing|free|pro|ultra|exclusive|upgrade|which plan|best plan|cost|price|subscription)/.test(q)) return 'plans';
  if (/(hello|hi|hey|help|what can you|who are you)/.test(q)) return 'help';

  return 'out_of_scope';
}

export function generateAssistantResponse(question: string, currentPlan?: PlanId): AssistantIntent {
  const topic = matchTopic(question);

  switch (topic) {
    case 'start':
      return {
        topic: 'Getting started',
        response: [
          'Here is how to run your first audit:',
          '1. Open the New Audit page from the sidebar.',
          '2. Paste a website URL (e.g. https://yourclient.com) or a Google Maps link.',
          '3. Click Run audit. We crawl the page and run ~20 checks in a few seconds.',
          '4. When it finishes, open the result to see the full report.',
          '5. Use Download PDF to save a white-label copy for your client (Pro and above remove the watermark).',
          '6. All your audits are saved under Audit History, where you can view, download, or delete them.',
        ].join('\n'),
      };

    case 'report':
      return {
        topic: 'Understanding your report',
        response:
          'Your report runs 20 checks. Here is what each means:\n' +
          REPORT_SECTIONS.map((s) => `• ${s.title} — ${s.text}`).join('\n') +
          '\n\nThe Overall Score blends PageSpeed and the check pass rate. Read the Final Recommendations top-down — High priority items have the most impact.',
      };

    case 'improve':
      return {
        topic: 'Improving your URL',
        response:
          'Start with the High-priority fixes in your report. The most common wins:\n' +
          IMPROVE_TIPS.map((t) => `• ${t}`).join('\n') +
          '\n\nRe-run the audit after each round of fixes to track your score climbing.',
      };

    case 'developer':
      return {
        topic: 'Developer & technical help',
        response:
          'For website repairers, focus on these technical fixes first:\n' +
          '• Add a responsive viewport meta tag and fix tap-target spacing.\n' +
          '• Install an SSL certificate and remove all mixed-content (HTTP) resources.\n' +
          '• Inject LocalBusiness JSON-LD schema in the <head> of key pages.\n' +
          '• Add Open Graph and Twitter Card meta tags for social sharing.\n' +
          '• Compress images, set widths/heights, and lazy-load below-the-fold images.\n' +
          '• Defer or async non-critical JavaScript to cut mobile load time.\n' +
          '• Fix broken links and add a clean internal link hierarchy.\n' +
          '• Submit an XML sitemap and check robots.txt for accidental blocks.\n' +
          'Re-run the audit after deploying to confirm each check flips to passed.',
      };

    case 'plans': {
      const lines = PLAN_GUIDE.map(
        (p) => `${p.name} → ${p.fit}: ${p.detail}`,
      ).join('\n');
      const youLine = currentPlan
        ? `\n\nYou are currently on the ${PLAN_GUIDE.find((p) => p.id === currentPlan)?.name ?? currentPlan} plan.`
        : '';
      return {
        topic: 'Choosing a plan',
        response:
          'Pick the plan that matches your workload:\n' + lines + youLine +
          '\n\nUpgrade from the Billing page anytime — changes take effect immediately.',
      };
    }

    case 'help':
      return {
        topic: 'AuditFlow AI',
        response:
          "Hi, I'm AuditFlow AI. I can help you:\n" +
          '• Run and understand audits (ask "how do I run an audit?")\n' +
          '• Explain any report check (ask "what does schema mean?")\n' +
          '• Suggest improvements for a URL (ask "how do I improve my score?")\n' +
          '• Give developer-level fixes (ask "technical SEO help")\n' +
          '• Pick the right plan (ask "which plan should I choose?")\n' +
          'I only answer questions about AuditFlow SEO and website audits.',
      };

    case 'out_of_scope':
    default:
      return { topic: 'Out of scope', response: OUT_OF_SCOPE };
  }
}
