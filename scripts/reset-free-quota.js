const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

  // Reset aiMatching and jobSearch for all FREE users for today
  const freeUsers = await prisma.user.findMany({
    where: { plan: 'FREE' },
    select: { id: true, email: true },
  });

  for (const user of freeUsers) {
    const updated = await prisma.dailyUsage.updateMany({
      where: { userId: user.id, date: today },
      data: { aiMatching: 0, jobSearch: 0 },
    });
    console.log(`Reset quotas for ${user.email}: ${updated.count} row(s) updated`);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
