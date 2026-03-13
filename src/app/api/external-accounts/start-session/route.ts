import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 10;

const SITE_CONFIG: Record<string, { label: string; loginUrl: string }> = {
  indeed:    { label: 'Indeed',     loginUrl: 'https://fr.indeed.com/account/login' },
  meteojob:  { label: 'Météo Job',  loginUrl: 'https://www.meteojob.com/connexion' },
  hellowork: { label: 'HelloWork',  loginUrl: 'https://www.hellowork.com/fr-fr/connexion.html' },
  monster:   { label: 'Monster',    loginUrl: 'https://www.monster.fr/connexion' },
  linkedin:  { label: 'LinkedIn',   loginUrl: 'https://www.linkedin.com/login' },
};

/**
 * POST /api/external-accounts/start-session
 * Creates a live browser session via Browserless.io and returns an interactive URL
 * that can be embedded as an iframe so the user can log in without leaving the app.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json() as { site?: string; email?: string };
  const { site, email } = body;

  if (!site || !email) {
    return NextResponse.json({ error: 'site et email sont requis' }, { status: 400 });
  }

  const config = SITE_CONFIG[site];
  if (!config) {
    return NextResponse.json({ error: 'Site non supporté' }, { status: 400 });
  }

  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service de navigation cloud non configuré (BROWSERLESS_API_KEY manquante)' }, { status: 503 });
  }

  // Pre-create or update the account record so capture-cookies can find it
  await prisma.externalAccount.upsert({
    where: { userId_site: { userId, site } },
    update: { email, isValid: false },
    create: {
      userId,
      site,
      siteLabel: config.label,
      loginUrl: config.loginUrl,
      email,
      passwordHash: '',
      isValid: false,
    },
  });

  // Browserless live viewer URL — opens a real Chromium navigating to loginUrl
  // The user interacts with it inside an iframe on careerpilot.fr
  const sessionUrl =
    `https://production-sfo.browserless.io/devtools/inspector/share` +
    `?token=${apiKey}` +
    `&url=${encodeURIComponent(config.loginUrl)}`;

  return NextResponse.json({ sessionUrl });
}
