require('dotenv').config({ path: '.env.prod.tmp' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

bcrypt.hash('GhiloxfeatChaïma', 12).then(hash => {
  return prisma.user.upsert({
    where: { email: 'lemarcelonaiytb@gmail.com' },
    update: { passwordHash: hash, emailVerified: true, plan: 'PRO' },
    create: {
      email: 'lemarcelonaiytb@gmail.com',
      passwordHash: hash,
      firstName: 'Lemarcelon',
      lastName: '',
      emailVerified: true,
      plan: 'PRO',
    },
  });
}).then(u => {
  console.log('✅ Compte créé/mis à jour en PRODUCTION !');
  console.log('Email :', u.email);
  console.log('ID    :', u.id);
  console.log('Plan  :', u.plan);
}).catch(e => {
  console.error('❌ Erreur :', e.message);
}).finally(() => prisma.$disconnect());
