import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const maxDuration = 15;

const SITE_CONFIG: Record<string, { label: string; loginUrl: string }> = {
  indeed:    { label: 'Indeed',    loginUrl: 'https://fr.indeed.com/account/login' },
  meteojob:  { label: 'Météo Job', loginUrl: 'https://www.meteojob.com/candidate/signin' },
  hellowork: { label: 'HelloWork', loginUrl: 'https://www.hellowork.com/fr-fr/connexion.html' },
  monster:   { label: 'Monster',   loginUrl: 'https://www.monster.fr/connexion' },
  linkedin:  { label: 'LinkedIn',  loginUrl: 'https://www.linkedin.com/login' },
};

/**
 * POST /api/external-accounts/start-session
 * Crée une session navigateur sur le microservice automation (Railway).
 * Retourne sessionId + wsUrl pour le stream WebSocket canvas côté client.
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

  const automationUrl = process.env.AUTOMATION_SERVICE_URL;
  const automationSecret = process.env.AUTOMATION_SECRET;

  if (!automationUrl || !automationSecret) {
    return NextResponse.json({ error: 'Service d\'automatisation non configuré' }, { status: 503 });
  }

  const sessionId = randomUUID();

  // Créer la session navigateur sur le microservice Railway
  const sessionRes = await fetch(`${automationUrl}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-automation-secret': automationSecret },
    body: JSON.stringify({ sessionId, initialUrl: config.loginUrl }),
  });

  if (!sessionRes.ok) {
    const err = await sessionRes.text();
    console.error('[start-session] Automation error:', sessionRes.status, err);
    return NextResponse.json({ error: 'Impossible de créer la session de navigation' }, { status: 502 });
  }

  console.log(`[start-session] Session créée: ${sessionId} pour ${site}`);

  // Sauvegarder l'email et l'ID de session en base
  await prisma.externalAccount.upsert({
    where: { userId_site: { userId, site } },
    update: { email, isValid: false, cookiesJson: JSON.stringify({ pendingSessionId: sessionId }) },
    create: {
      userId,
      site,
      siteLabel: config.label,
      loginUrl: config.loginUrl,
      email,
      passwordHash: '',
      isValid: false,
      cookiesJson: JSON.stringify({ pendingSessionId: sessionId }),
    },
  });

  // URL WebSocket pour le stream vidéo (utilisée par le composant BrowserViewer)
  const wsUrl = `${automationUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/stream?sessionId=${sessionId}&secret=${automationSecret}`;

  return NextResponse.json({ sessionId, wsUrl });
}
