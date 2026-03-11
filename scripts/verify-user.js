const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { emailVerified: true },
    select: { email: true, emailVerified: true, adminLevel: true },
  });
  console.log('Compte mis à jour:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
