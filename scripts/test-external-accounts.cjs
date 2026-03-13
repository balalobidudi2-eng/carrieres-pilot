// Test script for external-accounts API
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'ghilesaimeur951@gmail.com' } });
  if (!user) throw new Error('Admin user not found');
  const TOKEN = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  await prisma.$disconnect();

  const BASE = 'http://localhost:3000';
  let passed = 0;
  const total = 4;

  // Test 1 — GET returns array, never passwordHash
  const r1 = await fetch(BASE + '/api/external-accounts', { headers: { Authorization: 'Bearer ' + TOKEN } });
  const d1 = await r1.json();
  const t1a = r1.status === 200;
  const t1b = Array.isArray(d1);
  const t1c = !JSON.stringify(d1).includes('passwordHash') && !JSON.stringify(d1).includes('cookiesJson');
  if (t1a && t1b && t1c) passed++;
  console.log('GET /api/external-accounts       ' + (t1a && t1b && t1c ? '✅ PASS' : '❌ FAIL') +
    ' — status:' + r1.status + ' | tableau:' + t1b + ' | mdp_absent:' + t1c);

  // Test 2 — POST creates account with status 201
  const r2 = await fetch(BASE + '/api/external-accounts', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site: 'indeed',
      siteLabel: 'Indeed',
      loginUrl: 'https://fr.indeed.com/account/login',
      email: 'test@careerpilot.fr',
      password: 'TestPassword123!'
    })
  });
  const d2 = await r2.json();
  const t2 = r2.status === 201 && d2.site === 'indeed' && !d2.passwordHash;
  if (t2) passed++;
  console.log('POST /api/external-accounts      ' + (t2 ? '✅ PASS' : '❌ FAIL') +
    ' — status:' + r2.status + ' | site:' + d2.site + ' | passwordHash_absent:' + !d2.passwordHash);

  // Test 3 — GET returns the created account without sensitive fields
  const r3 = await fetch(BASE + '/api/external-accounts', { headers: { Authorization: 'Bearer ' + TOKEN } });
  const d3 = await r3.json();
  const found = Array.isArray(d3) && d3.find(a => a.site === 'indeed');
  const t3 = !!found && !found.passwordHash && !found.cookiesJson;
  if (t3) passed++;
  console.log('GET confirms account created     ' + (t3 ? '✅ PASS' : '❌ FAIL') +
    ' — found:' + !!found + ' | sensitive_absent:' + (found ? !found.passwordHash : 'n/a'));

  // Test 4 — DELETE removes the account
  if (found) {
    const r4 = await fetch(BASE + '/api/external-accounts/' + found.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + TOKEN }
    });
    const d4 = await r4.json();
    const t4 = r4.status === 200 && d4.success === true;
    if (t4) passed++;
    console.log('DELETE /api/external-accounts/:id' + (t4 ? '✅ PASS' : '❌ FAIL') +
      ' — status:' + r4.status + ' | success:' + d4.success);
  } else {
    console.log('DELETE /api/external-accounts/:id ⏭  SKIP — no account to delete');
  }

  console.log('\nRÉSULTAT : ' + passed + '/' + total + ' tests passés\n');
  process.exit(passed === total ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
