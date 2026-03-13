import { chromium, Browser, BrowserContext, Page } from 'playwright-core';

export interface LoginConfig {
  loginUrl: string;
  email: string;
  password: string;
  site: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  cookies?: object[];
}

interface SiteSelectors {
  emailSelector: string;
  passwordSelector: string;
  submitSelector: string;
  successIndicator: string;
}

// Known selectors per site — extend as needed
const SITE_SELECTORS: Record<string, SiteSelectors> = {
  indeed: {
    emailSelector: 'input[name="emailAddress"], input[type="email"]',
    passwordSelector: 'input[name="password"], input[type="password"]',
    submitSelector: 'button[type="submit"], button:has-text("Se connecter"), button:has-text("Sign in")',
    successIndicator: '[data-testid="UserDropdownButton"], .icl-Avatar, [aria-label*="compte"]',
  },
  meteojob: {
    emailSelector: 'input[name="email"], input[type="email"]',
    passwordSelector: 'input[name="password"], input[type="password"]',
    submitSelector: 'button[type="submit"]',
    successIndicator: '.user-menu, .account-menu, [href*="logout"], [href*="deconnexion"]',
  },
  monster: {
    emailSelector: 'input[name="email"], input[type="email"]',
    passwordSelector: 'input[name="password"], input[type="password"]',
    submitSelector: 'button[type="submit"]',
    successIndicator: '.account-nav, [data-cy="user-menu"], [href*="logout"]',
  },
  linkedin: {
    emailSelector: 'input#username, input[name="session_key"]',
    passwordSelector: 'input#password, input[name="session_password"]',
    submitSelector: 'button[type="submit"]',
    successIndicator: '[data-control-name="nav.homepage"], .global-nav__me-photo',
  },
  // Generic selectors for unconfigured sites
  default: {
    emailSelector: 'input[type="email"], input[name="email"], input[name="username"], input[name="login"]',
    passwordSelector: 'input[type="password"], input[name="password"]',
    submitSelector: 'button[type="submit"], input[type="submit"]',
    successIndicator: '[href*="logout"], [href*="deconnexion"], [href*="signout"], .user-account, .user-menu',
  },
};

const COOKIE_BANNER_SELECTORS = [
  'button:has-text("Accepter tout")',
  'button:has-text("Tout accepter")',
  'button:has-text("Accepter")',
  'button:has-text("Accept all")',
  'button:has-text("Accept")',
  '#onetrust-accept-btn-handler',
  '.cookie-accept',
  '[aria-label*="accept"]',
];

/** Test a login on an external job site using Playwright */
export async function testExternalLogin(config: LoginConfig): Promise<LoginResult> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const selectors = SITE_SELECTORS[config.site] ?? SITE_SELECTORS.default;

    console.log(`[playwright-login] Navigating to ${config.loginUrl}`);
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Dismiss cookie banners
    for (const sel of COOKIE_BANNER_SELECTORS) {
      const btn = await page.$(sel).catch(() => null);
      if (btn) {
        await btn.click().catch(() => null);
        await page.waitForTimeout(500);
        break;
      }
    }

    // Fill email
    const emailField = await page.$(selectors.emailSelector);
    if (!emailField) {
      return { success: false, message: 'Champ email introuvable sur la page de connexion' };
    }
    await emailField.click();
    await emailField.fill(config.email);
    console.log('[playwright-login] Email filled');

    // Fill password
    const passwordField = await page.$(selectors.passwordSelector);
    if (!passwordField) {
      return { success: false, message: 'Champ mot de passe introuvable' };
    }
    await passwordField.click();
    await passwordField.fill(config.password);
    console.log('[playwright-login] Password filled');

    // Submit
    const submitBtn = await page.$(selectors.submitSelector);
    if (!submitBtn) {
      return { success: false, message: 'Bouton de connexion introuvable' };
    }

    await Promise.all([
      page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch(() => null),
      submitBtn.click(),
    ]);

    await page.waitForTimeout(2000);

    // Check success indicators
    const successEl = await page.$(selectors.successIndicator).catch(() => null);
    const currentUrl = page.url();

    // Check for error messages on the page
    const pageText = (await page.textContent('body').catch(() => '')) ?? '';
    const lowerText = pageText.toLowerCase();
    const isOnLoginPage = currentUrl.includes('login') || currentUrl.includes('connexion') || currentUrl.includes('signin');
    const hasErrorSignal =
      isOnLoginPage &&
      (lowerText.includes('incorrect') ||
        lowerText.includes('invalide') ||
        lowerText.includes('invalid') ||
        lowerText.includes('erreur') ||
        lowerText.includes('error') ||
        lowerText.includes('mot de passe incorrect'));

    if (!successEl && hasErrorSignal) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    // Consider success if we navigated away from login page or found success element
    const navigatedAway = !isOnLoginPage;
    if (!successEl && !navigatedAway) {
      return {
        success: false,
        message: 'Connexion non confirmée — vérifiez votre email et mot de passe',
      };
    }

    const cookies = await context.cookies();
    console.log(`[playwright-login] Login succeeded, ${cookies.length} cookies saved`);

    return {
      success: true,
      message: 'Connexion réussie',
      cookies,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[playwright-login] Error:', msg);
    return { success: false, message: `Erreur technique : ${msg}` };
  } finally {
    await browser?.close();
  }
}

/**
 * Create a browser context pre-loaded with saved cookies.
 * Returns null if the cookies are expired (triggers re-login).
 */
export async function loginWithCookies(
  targetUrl: string,
  cookiesJson: string
): Promise<{ context: BrowserContext; page: Page; browser: Browser } | null> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext();
    const cookies = JSON.parse(cookiesJson) as Parameters<BrowserContext['addCookies']>[0];
    await context.addCookies(cookies);

    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // If still on login page, cookies are expired
    const currentUrl = page.url();
    const isLoginPage =
      currentUrl.includes('login') ||
      currentUrl.includes('connexion') ||
      currentUrl.includes('signin');

    if (isLoginPage) {
      await browser.close();
      return null;
    }

    return { context, page, browser };
  } catch {
    await browser?.close();
    return null;
  }
}

/** Detect which external site an offer URL belongs to */
export function detectSiteFromUrl(offerUrl: string): string {
  const url = offerUrl.toLowerCase();
  if (url.includes('indeed')) return 'indeed';
  if (url.includes('meteojob')) return 'meteojob';
  if (url.includes('monster')) return 'monster';
  if (url.includes('linkedin')) return 'linkedin';
  return 'custom';
}
