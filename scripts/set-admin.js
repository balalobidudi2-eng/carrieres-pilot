const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { adminLevel: 1 },
    select: { id: true, email: true, plan: true, adminLevel: true },
  });
  console.log('Admin rights set:', JSON.stringify(u));
}
main().catch(console.error).finally(() => prisma.$disconnect());
