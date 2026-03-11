const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure no other Level 3 admin exists first
  const existing = await prisma.user.findFirst({
    where: { adminLevel: 3, NOT: { email: 'ghilesaimeur951@gmail.com' } },
    select: { email: true },
  });
  if (existing) {
    console.log('WARNING: Another Level 3 admin exists:', existing.email);
    console.log('Downgrading them to Level 2...');
    await prisma.user.updateMany({
      where: { adminLevel: 3, NOT: { email: 'ghilesaimeur951@gmail.com' } },
      data: { adminLevel: 2 },
    });
  }

  const user = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { adminLevel: 3 },
    select: { email: true, adminLevel: true },
  });
  console.log('Admin upgraded:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
