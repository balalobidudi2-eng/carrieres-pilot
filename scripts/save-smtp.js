/**
 * Directly save SMTP config to DB, bypassing the API
 */
const { PrismaClient } = require('@prisma/client');
const { createCipheriv, randomBytes } = require('crypto');

const ENC_KEY = (process.env.SMTP_ENCRYPTION_KEY ?? 'carrieres-pilot-smtp-enc-key!!').slice(0, 32).padEnd(32, '!');

function encryptPassword(plain) {
  const iv = randomBytes(16);
  const crypto = require('crypto');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  let enc = cipher.update(plain, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}

const prisma = new PrismaClient();

async function main() {
  const password = 'mfzj ygii crfa qski'; // Google app password from screenshot
  const enc = encryptPassword(password);
  console.log('Encrypted password length:', enc.length);

  const result = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'ghilesaimeur951@gmail.com',
      smtpPassEnc: enc,
      smtpFrom: 'ghilesaimeur951@gmail.com',
    },
    select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPassEnc: true },
  });

  console.log('Saved successfully:');
  console.log({
    smtpHost: result.smtpHost,
    smtpPort: result.smtpPort,
    smtpUser: result.smtpUser,
    smtpPassEnc: result.smtpPassEnc ? '(chiffré OK)' : '(vide)',
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
