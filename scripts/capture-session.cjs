#!/usr/bin/env node
/**
 * capture-session.cjs — Local script to capture a browser session for OTP sites.
 *
 * Usage:
 *   node scripts/capture-session.cjs <site> --email <email> [--loginUrl <url>] [--api <url>]
 *
 * Examples:
 *   node scripts/capture-session.cjs indeed --email you@example.com
 *   node scripts/capture-session.cjs hellowork --email you@example.com
 *   node scripts/capture-session.cjs indeed --email you@example.com --api https://xn--carrirepilot-feb.fr
 *
 * The script:
 *   1. Authenticates to CareerPilot using .env.local credentials
 *   2. Opens a VISIBLE browser window on your screen
 *   3. You log in normally (email → OTP code → connected)
 *   4. Cookies are captured and sent to the API automatically
 */

const path = require('path');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Load .env.local with override so it takes priority over .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });

// ── Parse CLI args ────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const site = rawArgs[0];

if (!site || site.startsWith('--')) {
  console.error('Usage: node scripts/capture-session.cjs <site> --email <email> [--loginUrl <url>] [--api <url>]');
  console.error('Sites supportés : indeed, hellowork, meteojob, monster, linkedin');
  process.exit(1);
}

function getArg(name) {
  const idx = rawArgs.indexOf('--' + name);
  return idx !== -1 ? rawArgs[idx + 1] : null;
}

const emailArg    = getArg('email');
const loginUrlArg = getArg('loginUrl');
const apiBase     = getArg('api') || 'http://localhost:3000';

if (!emailArg) {
  console.error('Erreur : --email requis');
  process.exit(1);
}

// ── Default login URLs per site ───────────────────────────────────────────────

const DEFAULT_LOGIN_URLS = {
  indeed:    'https://fr.indeed.com/account/login',
  hellowork: 'https://www.hellowork.com/fr-fr/connexion.html',
  meteojob:  'https://www.meteojob.com/connexion',
  monster:   'https://www.monster.fr/connexion',
  linkedin:  'https://www.linkedin.com/login',
};

const loginUrl = loginUrlArg || DEFAULT_LOGIN_URLS[site];
if (!loginUrl) {
  console.error(`Site inconnu "${site}" et aucune --loginUrl fournie.`);
  process.exit(1);
}

// ── Success selectors per site (same as manual-login route) ──────────────────

const SUCCESS_INDICATORS = {
  indeed:    '.icl-Avatar, [data-testid="UserDropdownButton"], [href*="/resume"]',
  hellowork: '.user-avatar, [href*="mon-profil"], [href*="deconnexion"]',
  meteojob:  '.user-menu, [href*="mon-compte"]',
  monster:   '.account-nav, [data-cy="user-menu"]',
  linkedin:  '[data-control-name="nav.homepage"], .global-nav__me-photo',
  default:   '[href*="logout"], [href*="deconnexion"], [href*="signout"]',
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Get user from DB and generate auth token
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: emailArg } })
    .catch(() => null);

  if (!user) {
    // Try admin user if emailArg is a site email rather than a careerpilot account
    const admin = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!admin) {
      console.error('Aucun utilisateur trouvé dans la base. Lancez d\'abord le serveur local.');
      await prisma.$disconnect();
      process.exit(1);
    }
    console.log(`ℹ  Utilisateur CareerPilot utilisé : ${admin.email}`);
    await runCapture(prisma, admin, emailArg);
  } else {
    await runCapture(prisma, user, emailArg);
  }
}

async function runCapture(prisma, user, siteEmail) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET manquant dans .env.local');
    await prisma.$disconnect();
    process.exit(1);
  }

  const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
  await prisma.$disconnect();

  // 2. Open browser
  let playwright;
  try {
    playwright = require('playwright-core');
  } catch {
    console.error('playwright-core introuvable. Lancez : npm install playwright-core');
    process.exit(1);
  }

  const { chromium } = playwright;
  console.log(`\n🚀 Ouverture de ${site} (${loginUrl})…`);
  console.log('   → Connectez-vous normalement dans la fenêtre qui s\'ouvre.');
  console.log('   → Le script attend votre connexion (max 3 minutes).\n');

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--start-maximized'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Pre-fill email
    const emailField = await page.$('input[type="email"], input[name="email"]').catch(() => null);
    if (emailField && siteEmail) {
      await emailField.fill(siteEmail);
      console.log(`✎  Email pré-rempli : ${siteEmail}`);
    }

    // Wait for successful login
    const successSelector = SUCCESS_INDICATORS[site] || SUCCESS_INDICATORS.default;
    try {
      await page.waitForSelector(successSelector, { timeout: 180_000 });
      console.log('\n✅ Connexion détectée !');
    } catch {
      await browser.close();
      console.error('\n❌ Délai dépassé (3 min). Réessayez.');
      process.exit(1);
    }

    const cookies = await context.cookies();
    console.log(`   ${cookies.length} cookies capturés.\n`);
    await browser.close();

    // 3. Send cookies to API
    const siteLabel = site.charAt(0).toUpperCase() + site.slice(1);
    console.log(`📤 Envoi de la session à ${apiBase}…`);

    const res = await fetch(`${apiBase}/api/external-accounts/save-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site,
        siteLabel,
        email: siteEmail,
        loginUrl,
        cookiesJson: JSON.stringify(cookies),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      console.log(`✅ ${data.message}`);
      console.log('\nCareerPilot utilisera cette session pour postuler automatiquement sur ' + siteLabel + '.');
    } else {
      console.error('❌ Erreur API (' + res.status + ') :', data.error || data.message || 'Erreur inconnue');
      process.exit(1);
    }
  } catch (e) {
    await browser?.close();
    console.error('❌ Erreur Playwright :', e.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Erreur fatale :', e.message);
  process.exit(1);
});
