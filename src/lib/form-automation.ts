/**
 * Form Automation Service
 *
 * Strategy:
 * 1. Scrape the job offer URL for a contact email address (direct HTML scraping).
 * 2. If not found → ask OpenAI to deduce a likely contact email from company name + offer data.
 * 3. If email found (by either method) → send personalised email with CV + cover letter attachments.
 * 4. If no email found → Playwright navigates to the offer URL, fills the form and submits it.
 *
 * Playwright runtime:
 * - Production (Vercel serverless): playwright-core + @sparticuz/chromium-min
 * - Development: playwright-core with local chromium (falls back to system chromium)
 */

import OpenAI from 'openai';
import { sendApplicationEmail } from './email-service';

export interface FormFillRequest {
  applicationUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  cvPdfUrl?: string;
  coverLetterText?: string;
  /** Job offer title — used to personalise the email subject / body */
  offerTitle?: string;
  /** Company name — used to personalise the email subject / body */
  offerCompany?: string;
  customFields?: Record<string, string>;
  /** Authenticated user ID — used to fetch their SMTP config from the DB */
  userId?: string;
}

export interface FormFillResult {
  success: boolean;
  status: 'submitted' | 'partial' | 'failed' | 'unsupported' | 'email_sent';
  message: string;
  fieldsFilledCount?: number;
  screenshotUrl?: string;
}

// ─── Email extraction ────────────────────────────────────────────────────────

const EMAIL_BLOCKLIST = [
  'example', 'sentry.io', 'noreply', 'no-reply',
  'webpack', '.png', '.jpg', '.svg', '@2x',
];

function isValidApplicationEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !EMAIL_BLOCKLIST.some((b) => lower.includes(b));
}

/**
 * Fetch the page at `url` and look for a recruiter / contact email.
 * Returns { email, pageText } — pageText is passed to the AI fallback if no email is found directly.
 */
async function findCompanyEmail(url: string): Promise<{ email: string | null; pageText: string | null }> {
  if (!url) return { email: null, pageText: null };

  // Job-board URLs don't expose direct company emails — skip scraping.
  const jobBoards = ['francetravail.fr', 'pole-emploi.fr', 'linkedin.com', 'indeed.com', 'welcometothejungle.com'];
  if (jobBoards.some((b) => url.includes(b))) return { email: null, pageText: null };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CarrierePilot/1.0)' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return { email: null, pageText: null };

    const html = await res.text();
    // Strip tags for a clean text snippet to pass to AI
    const pageText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Prefer explicit mailto: links (most reliable signal)
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    if (mailtoMatch && isValidApplicationEmail(mailtoMatch[1])) return { email: mailtoMatch[1], pageText };

    // Fall back to raw email pattern in the page text
    const emailRegex = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
    let m: RegExpExecArray | null;
    while ((m = emailRegex.exec(html)) !== null) {
      if (isValidApplicationEmail(m[1])) return { email: m[1], pageText };
    }

    return { email: null, pageText };
  } catch {
    return { email: null, pageText: null };
  }
}

// ─── AI-powered email finder ─────────────────────────────────────────────────

/**
 * Ask OpenAI to deduce a likely recruiter/contact email based on the company
 * name, offer title and page URL. Returns null if OpenAI is not configured,
 * returns a low-confidence guess, or the response doesn't look like an email.
 */
async function findEmailWithAI(req: FormFillRequest, pageText?: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const context = [
    req.offerCompany ? `Entreprise : ${req.offerCompany}` : '',
    req.offerTitle   ? `Poste : ${req.offerTitle}` : '',
    req.applicationUrl ? `URL de l'offre : ${req.applicationUrl}` : '',
    pageText ? `Extrait de la page (500 premiers caractères) :\n${pageText.slice(0, 500)}` : '',
  ].filter(Boolean).join('\n');

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un assistant spécialisé dans la recherche de contacts RH. ' +
            'Ton seul rôle est de déduire l\'adresse email de recrutement la plus probable pour une offre d\'emploi. ' +
            'Tu réponds UNIQUEMENT avec l\'adresse email (ex: recrutement@entreprise.fr) ou le mot "INCONNU" si tu ne peux pas déduire. ' +
            'N\'invente jamais un domaine : utilise seulement les informations fournies pour déduire le domaine réel de l\'entreprise.',
        },
        {
          role: 'user',
          content: `Voici les informations sur cette offre d'emploi :\n${context}\n\nQuelle est l'adresse email de recrutement la plus probable ?`,
        },
      ],
      max_tokens: 60,
      temperature: 0.2,
    });

    const answer = res.choices[0]?.message?.content?.trim() ?? '';
    if (answer === 'INCONNU' || !answer.includes('@')) return null;

    // Validate format and blocklist
    const emailMatch = answer.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
    if (!emailMatch) return null;
    if (!isValidApplicationEmail(emailMatch[1])) return null;

    return emailMatch[1];
  } catch {
    return null;
  }
}



function buildEmailBody(req: FormFillRequest): string {
  const { firstName, lastName, email, phone, linkedinUrl, offerTitle, offerCompany, coverLetterText } = req;

  // If the user has a cover letter, use it as-is (it's already personalised)
  if (coverLetterText?.trim()) {
    return coverLetterText.trim();
  }

  // Generic fallback template
  const titlePart = offerTitle ? ` de ${offerTitle}` : '';
  const companyPart = offerCompany ? ` au sein de ${offerCompany}` : '';
  const signature = [
    `${firstName} ${lastName}`,
    email,
    phone ? `Tél : ${phone}` : '',
    linkedinUrl ? `LinkedIn : ${linkedinUrl}` : '',
  ].filter(Boolean).join('\n');

  return `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste${titlePart}${companyPart}.

Motivé(e) et disponible rapidement, je serais ravi(e) de pouvoir échanger avec vous sur cette opportunité. Vous trouverez ci-joint mon CV et ma lettre de motivation.

Dans l'attente de vous lire,

Cordialement,
${signature}`;
}

// ─── Playwright form automation ──────────────────────────────────────────────

/**
 * Resolves a Chromium executable path that works both locally and on Vercel serverless.
 * In production, uses @sparticuz/chromium-min which bundles a stripped Chromium binary
 * compatible with AWS Lambda / Vercel runtimes.
 */
async function getChromiumPath(): Promise<{ executablePath: string; args: string[] }> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless: use the stripped chromium binary from @sparticuz/chromium-min
    const chromiumMod = await import('@sparticuz/chromium-min');
    const chromium = chromiumMod.default;
    // Download the binary from the CDN the first time, then cache in /tmp
    const executablePath = await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar`,
    );
    return { executablePath, args: chromium.args };
  }
  // Local development: let playwright-core find chromium on its own
  return { executablePath: '', args: [] };
}

async function tryPlaywrightFill(req: FormFillRequest): Promise<FormFillResult> {
  let pw: typeof import('playwright-core');
  try {
    pw = await import('playwright-core');
  } catch {
    return {
      success: false,
      status: 'unsupported',
      message: 'Playwright non disponible sur ce serveur.',
    };
  }

  let browser: import('playwright-core').Browser | undefined;
  try {
    const { executablePath, args } = await getChromiumPath();

    const launchOptions: Parameters<typeof pw.chromium.launch>[0] = {
      headless: true,
      args: args.length > 0 ? args : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };
    if (executablePath) launchOptions.executablePath = executablePath;

    browser = await pw.chromium.launch(launchOptions);
    const context = await browser.newContext({
      // Behave like a real browser to reduce bot detection
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'fr-FR',
    });
    const page = await context.newPage();

    await page.goto(req.applicationUrl, { timeout: 25_000, waitUntil: 'domcontentloaded' });

    // Small wait for React/JS-rendered forms to mount
    await page.waitForTimeout(1500);

    let filled = 0;

    // ── Standard form fields (ATS: Lever, Greenhouse, Workday, Taleo, SmartRecruiters…) ──
    const fieldMap: Array<{ selectors: string[]; value: string }> = [
      {
        selectors: [
          'input[name*="first" i]', 'input[id*="first" i]',
          'input[placeholder*="prénom" i]', 'input[placeholder*="prenom" i]',
          'input[placeholder*="first name" i]',
          'input[aria-label*="prénom" i]',
        ],
        value: req.firstName,
      },
      {
        selectors: [
          'input[name*="last" i]', 'input[id*="last" i]',
          'input[placeholder*="nom" i]', 'input[placeholder*="last name" i]',
          'input[aria-label*="nom" i]',
        ],
        value: req.lastName,
      },
      {
        selectors: [
          'input[type="email"]', 'input[name*="email" i]',
          'input[id*="email" i]', 'input[placeholder*="email" i]',
        ],
        value: req.email,
      },
      {
        selectors: [
          'input[type="tel"]', 'input[name*="phone" i]',
          'input[name*="telephone" i]', 'input[name*="mobile" i]',
          'input[id*="phone" i]', 'input[placeholder*="téléphone" i]',
        ],
        value: req.phone ?? '',
      },
      {
        selectors: [
          'input[name*="linkedin" i]', 'input[id*="linkedin" i]',
          'input[placeholder*="linkedin" i]',
        ],
        value: req.linkedinUrl ?? '',
      },
    ];

    for (const { selectors, value } of fieldMap) {
      if (!value) continue;
      for (const sel of selectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 600 })) {
            await el.fill(value);
            filled++;
            break; // only fill the first matching field per category
          }
        } catch { /* selector absent */ }
      }
    }

    // ── Cover letter textarea ──
    if (req.coverLetterText) {
      const textareaSelectors = [
        'textarea[name*="cover" i]', 'textarea[id*="cover" i]',
        'textarea[name*="letter" i]', 'textarea[name*="lettre" i]',
        'textarea[placeholder*="lettre" i]', 'textarea[placeholder*="motivation" i]',
        'textarea',
      ];
      for (const sel of textareaSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 600 })) {
            await el.fill(req.coverLetterText);
            filled++;
            break;
          }
        } catch { /* absent */ }
      }
    }

    // ── CV file upload ──
    if (req.cvPdfUrl) {
      try {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 1000 })) {
          // Download the CV PDF to a temp buffer then attach it
          const cvRes = await fetch(req.cvPdfUrl);
          if (cvRes.ok) {
            const cvBuffer = Buffer.from(await cvRes.arrayBuffer());
            await fileInput.setInputFiles({
              name: `CV_${req.firstName}_${req.lastName}.pdf`,
              mimeType: 'application/pdf',
              buffer: cvBuffer,
            });
            filled++;
          }
        }
      } catch { /* no file input or download failed */ }
    }

    if (filled === 0) {
      return {
        success: false,
        status: 'failed',
        message: `Aucun champ de formulaire détecté sur cette page. Postulez directement : ${req.applicationUrl}`,
      };
    }

    // ── Submit the form ──
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button[aria-label*="submit" i]',
      'button[aria-label*="envoyer" i]',
      'button[aria-label*="postuler" i]',
      'button:has-text("Soumettre")',
      'button:has-text("Envoyer")',
      'button:has-text("Postuler")',
      'button:has-text("Candidater")',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
    ];

    let submitted = false;
    for (const sel of submitSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 800 })) {
          await btn.click();
          // Wait for navigation or confirmation message
          await Promise.race([
            page.waitForNavigation({ timeout: 8000 }),
            page.waitForSelector(
              '[class*="success" i], [class*="confirm" i], [class*="merci" i], [aria-live="polite"]',
              { timeout: 8000 },
            ),
          ]).catch(() => { /* timeout OK, page may not navigate */ });
          submitted = true;
          break;
        }
      } catch { /* absent */ }
    }

    return {
      success: submitted,
      status: submitted ? 'submitted' : 'partial',
      message: submitted
        ? `Candidature soumise automatiquement (${filled} champ(s) rempli(s)).`
        : `Formulaire pré-rempli (${filled} champ(s)) mais la soumission automatique n'a pas abouti. Vérifiez et validez manuellement.`,
      fieldsFilledCount: filled,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, status: 'failed', message: `Erreur Playwright : ${msg}` };
  } finally {
    await browser?.close();
  }
}

/**
 * Auto-apply to a job offer.
 *
 * @param mode - 'smtp' : email uniquement | 'playwright' : formulaire uniquement | 'both' : email d'abord, Playwright en fallback
 *
 * Priority order (mode = 'both'):
 * 1. Find a recruiter email on the page (HTML scraping) → send personalised email.
 * 2. Ask OpenAI to deduce the email → send personalised email.
 * 3. Use Playwright to navigate, fill the form and submit it directly.
 */
export async function autoFillApplicationForm(
  request: FormFillRequest,
  mode: 'smtp' | 'playwright' | 'both' = 'both',
): Promise<FormFillResult> {

  // ── Mode Playwright uniquement ─────────────────────────────────────────────
  if (mode === 'playwright') {
    return tryPlaywrightFill(request);
  }

  // ── Mode SMTP (+ mode Both) : email d'abord ────────────────────────────────
  const { email: scrapedEmail, pageText } = await findCompanyEmail(request.applicationUrl);
  const companyEmail = scrapedEmail ?? await findEmailWithAI(request, pageText ?? undefined);

  if (companyEmail) {
    const fullName = `${request.firstName} ${request.lastName}`;
    const subject = `Candidature — ${request.offerTitle ?? 'Poste'} chez ${request.offerCompany ?? 'votre entreprise'}`;
    const body = buildEmailBody(request);

    const result = await sendApplicationEmail({
      to: companyEmail,
      fromName: fullName,
      fromEmail: request.email,
      subject,
      body,
      cvAttachmentUrl: request.cvPdfUrl,
      coverLetterText: request.coverLetterText,
      userId: request.userId,
    });

    if (result.success) {
      return {
        success: true,
        status: 'email_sent',
        message: `Candidature envoyée par email à ${companyEmail}`,
        fieldsFilledCount: 3,
      };
    }
    // Email failed — si mode 'smtp' on s'arrête là, sinon fallback Playwright
    if (mode === 'smtp') {
      return {
        success: false,
        status: 'failed',
        message: `Échec de l'envoi email à ${companyEmail} (${result.error}). Vérifiez votre connexion SMTP.`,
      };
    }
  } else if (mode === 'smtp') {
    // Mode SMTP mais aucun email trouvé — pas de Playwright
    return {
      success: false,
      status: 'unsupported',
      message: `Aucune adresse email trouvée pour cette offre. Postulez directement : ${request.applicationUrl}`,
    };
  }

  // ── Fallback Playwright (mode 'both' quand email absent ou échoué) ─────────
  return tryPlaywrightFill(request);
}
