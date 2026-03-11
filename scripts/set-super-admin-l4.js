// Upgrade designated account to Super Admin (adminLevel 4) on Neon DB
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SUPER_ADMIN_EMAIL = 'ghilesaimeur951@gmail.com';

async function main() {
  // Demote any existing L4 (safety)
  await prisma.user.updateMany({
    where: { adminLevel: 4 },
    data: { adminLevel: 3 },
  });

  const updated = await prisma.user.update({
    where: { email: SUPER_ADMIN_EMAIL },
    data: { adminLevel: 4, emailVerified: true },
    select: { email: true, adminLevel: true },
  });

  console.log('✅ Super Admin (L4) défini :', JSON.stringify(updated));
}

main().catch(console.error).finally(() => prisma.$disconnect());
