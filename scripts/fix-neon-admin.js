require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Connexion à:', process.env.DATABASE_URL?.slice(0, 50) + '...');

  // Downgrade any existing L3 to L2
  await prisma.user.updateMany({
    where: { adminLevel: 3, NOT: { email: 'ghilesaimeur951@gmail.com' } },
    data: { adminLevel: 2 },
  });

  // Set correct password + level 3
  const hash = await bcrypt.hash('12345678', 12);
  const user = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { adminLevel: 3, emailVerified: true, passwordHash: hash },
    select: { email: true, adminLevel: true, emailVerified: true },
  });

  console.log('✅ Neon DB mis à jour:', JSON.stringify(user));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
