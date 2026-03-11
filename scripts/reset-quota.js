const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Set plan to PRO
  const user = await prisma.user.update({
    where: { email: 'admin@carrieres-pilot.fr' },
    data: { plan: 'PRO' },
    select: { id: true, plan: true },
  });
  console.log('Plan mis à jour:', user.plan);

  // Reset daily usage
  const deleted = await prisma.dailyUsage.deleteMany({
    where: { userId: user.id },
  });
  console.log('Quotas réinitialisés, lignes supprimées:', deleted.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
