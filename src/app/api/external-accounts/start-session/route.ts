import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 15;

const STEEL_API = 'https://api.steel.dev/v1';

const SITE_CONFIG: Record<string, { label: string; loginUrl: string }> = {
  indeed:    { label: 'Indeed',    loginUrl: 'https://fr.indeed.com/account/login' },
  meteojob:  { label: 'Météo Job', loginUrl: 'https://www.meteojob.com/connexion' },
  hellowork: { label: 'HelloWork', loginUrl: 'https://www.hellowork.com/fr-fr/connexion.html' },
  monster:   { label: 'Monster',   loginUrl: 'https://www.monster.fr/connexion' },
  linkedin:  { label: 'LinkedIn',  loginUrl: 'https://www.linkedin.com/login' },
};

/**
 * POST /api/external-accounts/start-session
 * Creates an interactive Steel.dev browser session and returns:
 *   - sessionUrl: the viewer URL to embed in an iframe (CORS-safe, designed for embedding)
 *   - sessionId: used by capture-cookies to retrieve cookies after login
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
    return NextResponse.json({ error: `Site "${site}" non supporté` }, { status: 400 });
  }

  const apiKey = process.env.STEEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service de navigation non configuré (STEEL_API_KEY manquante)' }, { status: 503 });
  }

  // Create an interactive Steel session — viewer_url is an iframe-safe URL
  const sessionRes = await fetch(`${STEEL_API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Steel-Api-Key': apiKey },
    body: JSON.stringify({
      timeout: 120000,       // 2 min for the user to log in
      is_interactive: true,  // user controls the browser via the iframe
      initial_url: config.loginUrl,
    }),
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.text();
    console.error('[start-session] Steel error:', sessionRes.status, err);
    return NextResponse.json({ error: 'Impossible de créer la session de navigation' }, { status: 502 });
  }

  const session = await sessionRes.json() as { id: string; sessionViewerUrl: string };
  console.log(`[start-session] Steel session créée: ${session.id} pour ${site}`);

  // Save account row + pending session id (cookiesJson = temp storage)
  await prisma.externalAccount.upsert({
    where: { userId_site: { userId, site } },
    update: { email, isValid: false, cookiesJson: JSON.stringify({ pendingSessionId: session.id }) },
    create: {
      userId,
      site,
      siteLabel: config.label,
      loginUrl: config.loginUrl,
      email,
      passwordHash: '',
      isValid: false,
      cookiesJson: JSON.stringify({ pendingSessionId: session.id }),
    },
  });

  return NextResponse.json({ sessionUrl: session.sessionViewerUrl, sessionId: session.id });
}
