const TEMP_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'getnada.com',
  'moakt.com',
  'emailondeck.com',
  'dispostable.com',
  'mailnesia.com',
  'maildrop.cc',
  'throwawaymail.com',
  'tempail.com',
  'tmpmail.org',
  'tmpmail.net',
]);

export function isTempEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1];
  if (!domain || !domain.includes('.')) return true;
  return TEMP_DOMAINS.has(domain);
}