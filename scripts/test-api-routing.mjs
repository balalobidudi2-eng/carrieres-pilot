// scripts/test-api-routing.mjs
// Usage : node scripts/test-api-routing.mjs
// Ce script vérifie que le routing API (source=adzuna/france_travail/both) fonctionne.
// À exécuter après chaque modification des fichiers offers.
// Nécessite que le serveur tourne sur localhost:3000 (npm run dev).

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load dotenv manually without the dotenv package constraint
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    console.error('⚠️  Impossible de lire .env.local:', e.message);
  }
}
loadEnv();

const require = createRequire(import.meta.url);

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function getToken() {
  const { PrismaClient } = require('@prisma/client');
  const jwt = require('jsonwebtoken');
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'ghilesaimeur951@gmail.com' },
    });
    if (!user) throw new Error('Admin user not found');
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
  } finally {
    await prisma.$disconnect();
  }
}

async function testSource(token, source, query = 'developpeur') {
  const url = `${BASE_URL}/api/offers?q=${encodeURIComponent(query)}&source=${encodeURIComponent(source)}`;
  let res, data;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await res.json();
  } catch (e) {
    return { source, status: 0, total: 0, ftLeaks: 0, azLeaks: 0, sources: [], error: e.message };
  }

  const offers = Array.isArray(data) ? data : data.offers ?? [];

  const ftLeaks = offers.filter(
    (o) => (o.url ?? '').includes('francetravail') || o.source === 'france_travail',
  );
  const azLeaks = offers.filter(
    (o) => (o.url ?? '').includes('adzuna.') || o.source === 'adzuna',
  );
  const sources = [...new Set(offers.map((o) => o.source ?? 'inconnu'))];

  return {
    source,
    status: res.status,
    total: offers.length,
    ftLeaks: ftLeaks.length,
    azLeaks: azLeaks.length,
    sources,
  };
}

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST ROUTING API — CareerPilot');
  console.log(`  Serveur : ${BASE_URL}`);
  console.log('══════════════════════════════════════════════\n');

  let token;
  try {
    token = await getToken();
    console.log('  ✅ Token admin généré\n');
  } catch (e) {
    console.error('  ❌ Impossible de générer un token:', e.message);
    console.error('     Assurez-vous que le serveur de dev est en cours d\'exécution (npm run dev)');
    process.exit(1);
  }

  const results = await Promise.all([
    testSource(token, 'adzuna'),
    testSource(token, 'france_travail'),
    testSource(token, 'both'),
  ]);

  let passed = 0;

  for (const r of results) {
    if (r.error) {
      console.log(`source=${r.source.padEnd(15)} ❌ FAIL — Erreur réseau: ${r.error}`);
      continue;
    }

    let ok = false;
    let detail = '';

    if (r.source === 'adzuna') {
      ok = r.status === 200 && r.ftLeaks === 0 && r.total > 0;
      detail = `${r.total} offres | fuites FT: ${r.ftLeaks} | sources: ${r.sources.join(', ')} | HTTP ${r.status}`;
    } else if (r.source === 'france_travail') {
      ok = r.status === 200 && r.azLeaks === 0 && r.total > 0;
      detail = `${r.total} offres | fuites AZ: ${r.azLeaks} | sources: ${r.sources.join(', ')} | HTTP ${r.status}`;
    } else if (r.source === 'both') {
      const hasBoth = r.sources.includes('adzuna') && r.sources.includes('france_travail');
      ok = r.status === 200 && r.total > 0 && hasBoth;
      detail = `${r.total} offres | sources: ${r.sources.join(', ')} | HTTP ${r.status}`;
    }

    if (ok) passed++;
    console.log(`source=${r.source.padEnd(15)} ${ok ? '✅ PASS' : '❌ FAIL'} — ${detail}`);
  }

  console.log(`\nRÉSULTAT : ${passed}/3 tests passés`);
  console.log('══════════════════════════════════════════════\n');

  process.exit(passed === 3 ? 0 : 1);
}

run().catch((e) => {
  console.error('Erreur fatale:', e);
  process.exit(1);
});
