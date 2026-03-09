import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 32-char encryption key — override with SMTP_ENCRYPTION_KEY env var
const ENC_KEY = (process.env.SMTP_ENCRYPTION_KEY ?? 'carrieres-pilot-smtp-enc-key!!').slice(0, 32).padEnd(32, '!');

export function encryptPassword(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let enc = cipher.update(plain, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}

export function decryptPassword(enc: string): string {
  const [ivHex, encrypted] = enc.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let dec = decipher.update(encrypted, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}
