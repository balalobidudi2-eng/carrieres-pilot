const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

bcrypt.hash('GhiloxfeatChaïma', 12).then(hash => {
  return prisma.user.create({
    data: {
      email: 'lemarcelonaiytb@gmail.com',
      passwordHash: hash,
      firstName: 'Lemarcelon',
      lastName: '',
      emailVerified: true,
      plan: 'PRO',
    },
  });
}).then(u => {
  console.log('Compte créé !');
  console.log('Email :', u.email);
  console.log('ID    :', u.id);
  console.log('Plan  :', u.plan);
}).catch(e => {
  if (e.code === 'P2002') {
    console.log('Un compte avec cet email existe déjà.');
  } else {
    console.error(e);
  }
}).finally(() => prisma.$disconnect());
