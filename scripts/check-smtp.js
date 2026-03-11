const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Chercher dans les deux DBs (locale et Neon via DATABASE_URL)
  const users = await prisma.user.findMany({
    select: { id: true, email: true, plan: true, adminLevel: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpPassEnc: true, smtpFrom: true },
  });
  console.log('=== Tous les utilisateurs avec SMTP ===');
  for (const user of users) {
    console.log(`\n--- ${user.email} (plan: ${user.plan}, admin: ${user.adminLevel ?? 0}) ---`);
    console.log(`  smtpHost:    ${user.smtpHost ?? '(vide)'}`);
    console.log(`  smtpPort:    ${user.smtpPort ?? '(vide)'}`);
    console.log(`  smtpUser:    ${user.smtpUser ?? '(vide)'}`);
    console.log(`  smtpPassEnc: ${user.smtpPassEnc ? '(présent)' : '(vide)'}`);
    console.log(`  smtpFrom:    ${user.smtpFrom ?? '(vide)'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
