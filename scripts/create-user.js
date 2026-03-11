const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

bcrypt.hash('Admin1234!', 12).then(hash => {
  return prisma.user.create({
    data: {
      email: 'admin@carrieres-pilot.fr',
      passwordHash: hash,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      plan: 'FREE',
    },
  });
}).then(u => {
  console.log('Compte créé !');
  console.log('Email :', u.email);
  console.log('ID    :', u.id);
}).catch(e => {
  if (e.code === 'P2002') {
    console.log('Un compte avec cet email existe déjà.');
  } else {
    console.error(e);
  }
}).finally(() => prisma.$disconnect());
