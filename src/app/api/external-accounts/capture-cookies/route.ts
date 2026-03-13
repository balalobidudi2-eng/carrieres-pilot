import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

const BROWSERLESS_WSS = 'wss://production-sfo.browserless.io';

// Selectors that confirm the user is logged in for each site
const LOGIN_SUCCESS_SELECTORS: Record<string, string[]> = {
  indeed:    ['.icl-Avatar', '[data-testid="UserDropdownButton"]', '[href*="/account/view"]', 'a[href*="resume"]'],
  meteojob:  ['.user-menu', '[href*="mon-compte"]', '[href*="deconnexion"]'],
  hellowork: ['.user-avatar', '[href*="mon-profil"]', '[href*="deconnexion"]'],
  monster:   ['.account-nav', '[data-cy="user-menu"]', '[href*="logout"]'],
  linkedin:  ['.global-nav__me', '[href*="/feed/"]', '.nav__button-secondary--profile'],
};

/**
 * POST /api/external-accounts/capture-cookies
 * Connects to the Browserless session that is still open in the user's iframe,
 * checks whether the user is logged in, and if so captures and stores the cookies.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json() as { site?: string };
  const { site } = body;

  if (!site) {
    return NextResponse.json({ error: 'site est requis' }, { status: 400 });
  }

  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'Service de navigation cloud non configuré' });
  }

  const account = await prisma.externalAccount.findFirst({ where: { userId, site } });
  if (!account) {
    return NextResponse.json({ success: false, message: 'Compte non trouvé — commencez par cliquer "Connecter"' });
  }

  try {
    const { chromium } = await import('playwright-core');

    // Connect to the already-running Browserless session
    const browser = await chromium.connectOverCDP(`${BROWSERLESS_WSS}?token=${apiKey}`);

    const contexts = browser.contexts();
    if (contexts.length === 0) {
      await browser.close();
      return NextResponse.json({
        success: false,
        message: 'Session expirée. Cliquez sur "Créer une session" pour recommencer.',
      });
    }

    const context = contexts[0];
    const pages = context.pages();
    const page = pages[pages.length - 1];

    // Check login success selectors
    const selectors = LOGIN_SUCCESS_SELECTORS[site] ?? ['[href*="logout"]', '[href*="deconnexion"]'];
    let isLoggedIn = false;
    for (const selector of selectors) {
      const el = await page.$(selector).catch(() => null);
      if (el) { isLoggedIn = true; break; }
    }

    if (!isLoggedIn) {
      await browser.close();
      return NextResponse.json({
        success: false,
        message: 'Connexion non détectée. Assurez-vous d\'être bien connecté dans la fenêtre, puis cliquez "J\'ai fini".',
      });
    }

    const cookies = await context.cookies();
    await browser.close();

    await prisma.externalAccount.update({
      where: { id: account.id },
      data: {
        cookiesJson: JSON.stringify(cookies),
        isValid: true,
        lastLoginAt: new Date(),
        lastTestedAt: new Date(),
      },
    });

    console.log(`[capture-cookies] ${cookies.length} cookies sauvegardés pour ${site} / user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `✅ Connexion ${account.siteLabel} sauvegardée ! CareerPilot peut maintenant postuler automatiquement.`,
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[capture-cookies] Erreur:', msg);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la capture de session. Réessayez.',
    });
  }
}
