const BAD_WORDS = [
  'fuck',
  'fucker',
  'fucking',
  'shit',
  'bullshit',
  'bitch',
  'bastard',
  'asshole',
  'ass',
  'dick',
  'piss',
  'crap',
  'damn',
  'cunt',
  'slut',
  'whore',
  'retard',
  'retarded',
  'idiot',
  'stupid',
  'moron',
  'loser',
  'hate',
  'kill',
  'rape',
  'nigger',
  'nigga',
  'fag',
  'faggot',
  'douche',
  'jackass',
  'motherfucker',
  'prick',
  'twat',
  'wanker',
  'bloody',
  'bugger',
  'bollocks',
  'kutta',
  'kamine',
  'kaminay',
  'harami',
  'haramzada',
  'bhenchod',
  'bhenchod',
  'betichod',
  'madarchod',
  'maderchod',
  'laude',
  'lodu',
  'lode',
  'chutiya',
  'chutya',
  'gaandu',
  'gandu',
  'gand',
  'gaand',
  'randi',
  'rundi',
  'tatti',
  'tatti',
  'ullu',
  'ullu ka patha',
  'saala',
  'sala',
  'salli',
  'salli',
  'kanjar',
  'chamar',
  'chuhra',
  'mirasi',
  'bhangi',
  'kutha',
  'kutti',
  'kuttiya',
  'kuttay',
  'haraami',
  'haraamzada',
  'jahil',
  'bewakoof',
  'pagal',
  'kafir',
  'murtad',
];

const BAD_WORD_PATTERNS = BAD_WORDS.map((word) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
});

export function containsBadWord(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  return BAD_WORD_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isCleanComment(text: string): { ok: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'Comment cannot be empty.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, reason: 'Comments are limited to 500 characters.' };
  }
  if (containsBadWord(trimmed)) {
    return { ok: false, reason: 'Please keep comments professional. Bad words are not allowed.' };
  }
  return { ok: true };
}
