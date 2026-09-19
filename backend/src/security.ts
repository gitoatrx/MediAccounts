import crypto from 'node:crypto';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function createOtp() {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export function hashOtp(email: string, code: string) {
  const secret = process.env.OTP_SECRET ?? process.env.SESSION_SECRET ?? 'development-only-secret';
  return crypto.createHash('sha256').update(`${normalizeEmail(email)}:${code}:${secret}`).digest('hex');
}

export function randomToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Full bank account numbers are encrypted at rest (AES-256-GCM). Set BANK_DATA_KEY in
// production; it falls back to OTP_SECRET so local development works without extra setup.
function bankDataKey() {
  const secret = process.env.BANK_DATA_KEY ?? process.env.OTP_SECRET ?? 'development-only-secret';
  return crypto.createHash('sha256').update(`bank-data:${secret}`).digest();
}

export function encryptSecret(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', bankDataKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
}

export function decryptSecret(value: string) {
  const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', bankDataKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
