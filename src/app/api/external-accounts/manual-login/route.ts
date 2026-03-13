import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120; // 2 minutes for user to complete OTP login

const SUCCESS_INDICATORS: Record<string, string> = {
  indeed:    '.icl-Avatar, [data-testid="UserDropdownButton"], [href*="/resume"]',
  hellowork: '.user-avatar, [href*="mon-profil"], [href*="deconnexion"]',
  meteojob:  '.user-menu, [href*="mon-compte"]',
  monster:   '.account-nav, [data-cy="user-menu"]',
  linkedin:  '[data-control-name="nav.homepage"], .global-nav__me-photo',
  default:   '[href*="logout"], [href*="deconnexion"], [href*="signout"]',
};

/**
 * POST /api/external-accounts/manual-login
 *
 * Opens a VISIBLE browser window (headless: false) so the user can complete
 * OTP/manual login. Captures cookies and saves to DB.
 *
 * ⚠️  Only works in local dev (NODE_ENV !== 'production').
 *     In production use scripts/capture-session.cjs instead.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Block in production — headless:false requires a display server
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      message:
        "La connexion interactive n'est pas disponible en production (pas d'affichage sur Vercel). " +
        'Utilisez le script local : node scripts/capture-session.cjs <site> --email <email>',
    }, { status: 501 });
  }

  const { site, email, loginUrl } = await req.json() as {
    site: string;
    email: string;
    loginUrl: string;
  };

  if (!site || !email || !loginUrl) {
    return NextResponse.json({ error: 'site, email et loginUrl sont requis' }, { status: 400 });
  }

  // Import dynamically to avoid bundling issues in environments where it's unused
  const { chromium } = await import('playwright-core');

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--start-maximized'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Pre-fill email if field is present
    const emailField = await page.$('input[type="email"], input[name="email"]').catch(() => null);
    if (emailField && email) {
      await emailField.fill(email);
      console.log(`[manual-login] Email pré-rempli : ${email}`);
    }

    const successSelector = SUCCESS_INDICATORS[site] ?? SUCCESS_INDICATORS.default;
    console.log(`[manual-login] En attente de la connexion (max 2 min)…`);

    try {
      await page.waitForSelector(successSelector, { timeout: 120_000 });
      console.log('[manual-login] Connexion détectée ✅');
    } catch {
      await browser.close();
      return NextResponse.json({
        success: false,
        message: 'Délai dépassé (2 min). Réessayez et complétez la connexion dans les 2 minutes.',
      });
    }

    const cookies = await context.cookies();
    console.log(`[manual-login] ${cookies.length} cookies capturés`);
    await browser.close();

    const siteLabel = site.charAt(0).toUpperCase() + site.slice(1);

    await prisma.externalAccount.upsert({
      where: { userId_site: { userId, site } },
      update: {
        email,
        cookiesJson: JSON.stringify(cookies),
        isValid: true,
        lastLoginAt: new Date(),
        lastTestedAt: new Date(),
        passwordHash: '',
        updatedAt: new Date(),
      },
      create: {
        userId,
        site,
        siteLabel,
        loginUrl,
        email,
        passwordHash: '',
        cookiesJson: JSON.stringify(cookies),
        isValid: true,
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Session ${siteLabel} capturée ! CareerPilot utilisera cette session pour postuler automatiquement.`,
    });
  } catch (e: unknown) {
    await browser?.close();
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[manual-login] Erreur:', msg);
    return NextResponse.json({ success: false, message: `Erreur technique : ${msg}` });
  }
}
