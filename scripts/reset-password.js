const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('12345678', 12);
  const user = await prisma.user.update({
    where: { email: 'ghilesaimeur951@gmail.com' },
    data: { passwordHash: hash },
    select: { id: true, email: true },
  });
  console.log('Mot de passe mis à jour pour:', user.email);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
