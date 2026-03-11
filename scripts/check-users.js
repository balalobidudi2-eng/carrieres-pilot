const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, plan: true, id: true },
  });
  console.log('Users:', JSON.stringify(users, null, 2));

  const usages = await prisma.dailyUsage.findMany({
    orderBy: { date: 'desc' },
    take: 10,
  });
  console.log('Recent daily usages:', JSON.stringify(usages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
