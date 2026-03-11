const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { plan: 'PRO' },
    select: { email: true, plan: true },
  });
  console.log('Plan mis à jour :', user.email, '->', user.plan);
}

main().catch(console.error).finally(() => prisma.$disconnect());
