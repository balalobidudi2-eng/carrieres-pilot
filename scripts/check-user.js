const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ghilesaimeur951@gmail.com' },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
      adminLevel: true,
      deletionScheduledAt: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
