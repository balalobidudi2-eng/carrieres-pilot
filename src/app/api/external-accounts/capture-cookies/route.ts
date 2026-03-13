import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

// Fragments d'URL indiquant une connexion réussie pour chaque site
const LOGIN_SUCCESS_FRAGMENTS: Record<string, string[]> = {
  indeed:    ['/account/view', '/myjobs', 'emplois.indeed.com', '/profil'],
  meteojob:  ['/mon-compte', '/candidat', '/mes-offres'],
  hellowork: ['/mon-profil', '/mes-candidatures', '/tableau-de-bord'],
  monster:   ['/profil', '/mes-candidatures', '/dashboard'],
  linkedin:  ['/feed', '/in/', '/mynetwork'],
};

const LOGIN_PAGE_FRAGMENTS = ['login', 'connexion', 'signin', 'sign-in', 'authenticate'];

/**
 * POST /api/external-accounts/capture-cookies
 * Appelle le microservice automation pour récupérer les cookies
 * du navigateur Playwright après que l'utilisateur s'est connecté.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json() as { site?: string; sessionId?: string };
  const { site, sessionId } = body;

  if (!site || !sessionId) {
    return NextResponse.json({ error: 'site et sessionId sont requis' }, { status: 400 });
  }

  const automationUrl = process.env.AUTOMATION_SERVICE_URL;
  const automationSecret = process.env.AUTOMATION_SECRET;

  if (!automationUrl || !automationSecret) {
    return NextResponse.json({ success: false, message: 'Service d\'automatisation non configuré' });
  }

  const account = await prisma.externalAccount.findFirst({ where: { userId, site } });
  if (!account) {
    return NextResponse.json({ success: false, message: 'Compte non trouvé — commencez par cliquer "Connecter"' });
  }

  try {
    // --- 1. Récupérer cookies + URL courante depuis le microservice ---
    const cookiesRes = await fetch(`${automationUrl}/sessions/${sessionId}/cookies`, {
      method: 'POST',
      headers: { 'x-automation-secret': automationSecret },
    });

    if (!cookiesRes.ok) {
      const errText = await cookiesRes.text();
      console.error('[capture-cookies] Microservice error:', cookiesRes.status, errText);
      return NextResponse.json({
        success: false,
        message: 'Session expirée ou introuvable. Recommencez la connexion.',
      });
    }

    const { cookies, currentUrl } = await cookiesRes.json() as { cookies: unknown[]; currentUrl: string };
    console.log(`[capture-cookies] URL: ${currentUrl} | ${cookies.length} cookies`);

    // --- 2. Vérifier la connexion via l'URL courante ---
    const successFragments = LOGIN_SUCCESS_FRAGMENTS[site] ?? [];
    const isOnLoginPage = LOGIN_PAGE_FRAGMENTS.some(f => currentUrl.toLowerCase().includes(f));
    const hasSuccessUrl = successFragments.some(f => currentUrl.includes(f));
    const isLoggedIn = hasSuccessUrl || (!isOnLoginPage && currentUrl.length > 0);

    if (!isLoggedIn) {
      return NextResponse.json({
        success: false,
        message: 'Connexion non détectée. Finissez de vous connecter dans la fenêtre puis cliquez à nouveau sur "J\'ai fini".',
      });
    }

    // --- 3. Fermer la session navigateur (libérer les ressources Railway) ---
    await fetch(`${automationUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'x-automation-secret': automationSecret },
    }).catch(() => { /* non-critique */ });

    // --- 4. Sauvegarder les cookies en base ---
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
    return NextResponse.json({ success: false, message: 'Erreur technique. Réessayez.' });
  }
}
