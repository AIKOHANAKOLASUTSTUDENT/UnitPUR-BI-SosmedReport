import crypto from 'node:crypto';

const algorithm = 'aes-256-gcm';

function getKey() {
  const secret = process.env.BACKEND_TOKEN_SECRET;
  if (!secret) {
    throw new Error('BACKEND_TOKEN_SECRET is required for token encryption.');
  }

  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptToken(value) {
  if (!value) {
    return '';
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptToken(payload) {
  if (!payload) {
    return '';
  }

  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
