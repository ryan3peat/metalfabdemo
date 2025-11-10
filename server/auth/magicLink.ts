import crypto from 'crypto';

export const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export function generateMagicLinkToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function getMagicLinkExpiryDate(): Date {
  return new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);
}
