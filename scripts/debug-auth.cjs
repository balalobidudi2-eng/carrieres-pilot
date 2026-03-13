// Debug script — check auth against external-accounts endpoint
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'ghilesaimeur951@gmail.com' } });
  console.log('User found:', user ? user.id : 'NOT FOUND');
  const TOKEN = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Token first 40 chars:', TOKEN.slice(0, 40));
  await prisma.$disconnect();

  const res = await fetch('http://localhost:3000/api/external-accounts', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });
  const body = await res.text();
  console.log('HTTP status:', res.status);
  console.log('Response body:', body.slice(0, 500));
}

main().catch(e => { console.error(e); process.exit(1); });
