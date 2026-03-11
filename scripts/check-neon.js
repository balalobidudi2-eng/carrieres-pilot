// Force l'utilisation de la DATABASE_URL de .env.local (Neon)
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 40) + '...');

  const user = await prisma.user.findUnique({
    where: { email: 'ghilesaimeur951@gmail.com' },
    select: { email: true, adminLevel: true, emailVerified: true },
  });
  console.log('User on THIS DB:', JSON.stringify(user));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
