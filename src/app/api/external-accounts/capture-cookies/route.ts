import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

const STEEL_API = 'https://api.steel.dev/v1';

// URL path fragments indicating successful login for each site
const LOGIN_SUCCESS_URL_FRAGMENTS: Record<string, string[]> = {
  indeed:    ['/account/view', '/myjobs', 'emplois.indeed.com', '/profil'],
  meteojob:  ['/mon-compte', '/candidat', '/mes-offres'],
  hellowork: ['/mon-profil', '/mes-candidatures', '/tableau-de-bord'],
  monster:   ['/profil', '/mes-candidatures', '/dashboard'],
  linkedin:  ['/feed', '/in/', '/mynetwork'],
};

/**
 * POST /api/external-accounts/capture-cookies
 * Uses the Steel REST API to check the current URL of the live session
 * and retrieve cookies. No Playwright / CDP needed.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json() as { site?: string; sessionId?: string };
  const { site, sessionId } = body;

  if (!site || !sessionId) {
    return NextResponse.json({ error: 'site et sessionId sont requis' }, { status: 400 });
  }

  const apiKey = process.env.STEEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'Service de navigation non configuré' });
  }

  const account = await prisma.externalAccount.findFirst({ where: { userId, site } });
  if (!account) {
    return NextResponse.json({ success: false, message: 'Compte non trouvé — commencez par cliquer "Connecter"' });
  }

  try {
    // --- 1. Get session info (current URL) ---
    const sessionRes = await fetch(`${STEEL_API}/sessions/${sessionId}`, {
      headers: { 'Steel-Api-Key': apiKey },
    });

    if (!sessionRes.ok) {
      return NextResponse.json({
        success: false,
        message: 'Session expirée ou introuvable. Recommencez la connexion.',
      });
    }

    const sessionData = await sessionRes.json() as { current_url?: string; status?: string };
    const currentUrl = sessionData.current_url ?? '';
    console.log(`[capture-cookies] URL actuelle (${site}): ${currentUrl}`);

    // --- 2. Verify login by checking current URL ---
    const successFragments = LOGIN_SUCCESS_URL_FRAGMENTS[site] ?? [];
    const loginPageFragments = ['login', 'connexion', 'signin', 'sign-in', 'authenticate'];

    const isOnLoginPage = loginPageFragments.some(f => currentUrl.toLowerCase().includes(f));
    const hasSuccessUrl = successFragments.some(f => currentUrl.includes(f));
    const isLoggedIn = hasSuccessUrl || (!isOnLoginPage && currentUrl !== '');

    if (!isLoggedIn) {
      return NextResponse.json({
        success: false,
        message: 'Connexion non détectée. Finissez de vous connecter dans la fenêtre puis cliquez à nouveau sur "J\'ai fini".',
      });
    }

    // --- 3. Retrieve cookies via Steel REST API ---
    const cookiesRes = await fetch(`${STEEL_API}/sessions/${sessionId}/cookies`, {
      headers: { 'Steel-Api-Key': apiKey },
    });

    const cookiesData = await cookiesRes.json() as { cookies?: unknown[] };
    const cookies = cookiesData.cookies ?? [];
    console.log(`[capture-cookies] ${cookies.length} cookies récupérés pour ${site}`);

    // --- 4. Release the Steel session (stop billing) ---
    await fetch(`${STEEL_API}/sessions/${sessionId}/release`, {
      method: 'POST',
      headers: { 'Steel-Api-Key': apiKey },
    }).catch(() => { /* non-critical */ });

    // --- 5. Persist cookies ---
    await prisma.externalAccount.update({
      where: { id: account.id },
      data: {
        cookiesJson: JSON.stringify(cookies),
        isValid: true,
        lastLoginAt: new Date(),
        lastTestedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `✅ Connexion ${account.siteLabel} sauvegardée ! CareerPilot peut maintenant postuler automatiquement.`,
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[capture-cookies] Erreur:', msg);
    return NextResponse.json({
      success: false,
      message: 'Erreur technique. Réessayez.',
    });
  }
}
