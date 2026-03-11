const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      company: true,
      jobTitle: true,
      status: true,
      contactEmail: true,
      createdAt: true,
      userId: true,
    },
  });
  
  if (apps.length === 0) {
    console.log('Aucune candidature trouvée en base de données.');
  } else {
    console.log('Candidatures récentes :');
    console.log(JSON.stringify(apps, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
