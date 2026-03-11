/**
 * Form Automation Service
 *
 * Strategy:
 * 1. Scrape the job offer URL for a contact email address (direct HTML scraping).
 * 2. If not found → ask OpenAI to deduce a likely contact email from company name + offer data.
 * 3. If email found (by either method) → send personalised email with CV + cover letter attachments.
 * 4. Playwright form automation is available but currently in standby.
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

// ─── Playwright fallback ─────────────────────────────────────────────────────

async function tryPlaywrightFill(req: FormFillRequest): Promise<FormFillResult> {
  let chromium: import('playwright').BrowserType;
  try {
    // Dynamic import so the module compiles even when playwright is absent
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    return {
      success: false,
      status: 'unsupported',
      message:
        'Aucun email trouvé sur cette offre. ' +
        'Pour l\'automatisation de formulaires, installez Playwright : ' +
        '`npm install playwright` puis `npx playwright install chromium`.',
    };
  }

  let browser: import('playwright').Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(req.applicationUrl, { timeout: 20000, waitUntil: 'domcontentloaded' });

    let filled = 0;

    // Generic field selectors — covers most ATS (Lever, Greenhouse, Workday, etc.)
    const fieldMap: Array<[string, string]> = [
      ['input[name*="first" i], input[placeholder*="prénom" i]', req.firstName],
      ['input[name*="last" i], input[placeholder*="nom" i]', req.lastName],
      ['input[type="email"], input[name*="email" i]', req.email],
      ['input[type="tel"], input[name*="phone" i], input[name*="telephone" i]', req.phone ?? ''],
      ['input[name*="linkedin" i], input[placeholder*="linkedin" i]', req.linkedinUrl ?? ''],
    ];

    for (const [selector, value] of fieldMap) {
      if (!value) continue;
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 1000 })) {
          await el.fill(value);
          filled++;
        }
      } catch { /* field not present on this page */ }
    }

    // Attach CV if the page has a file input
    if (req.cvPdfUrl) {
      try {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 1000 })) {
          await fileInput.setInputFiles(req.cvPdfUrl);
          filled++;
        }
      } catch { /* no file input */ }
    }

    return {
      success: filled > 0,
      status: filled > 0 ? 'partial' : 'failed',
      message: filled > 0
        ? `Formulaire pré-rempli (${filled} champ(s)). Vérifiez et soumettez manuellement.`
        : 'Impossible de remplir le formulaire automatiquement sur cette page.',
      fieldsFilledCount: filled,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, status: 'failed', message: `Erreur Playwright : ${msg}` };
  } finally {
    await browser?.close();
  }
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Auto-apply to a job offer.
 * Scrapes the page for a contact email → sends a personalised email with attachments.
 * Playwright form automation is available but disabled for now (standby).
 */
export async function autoFillApplicationForm(request: FormFillRequest): Promise<FormFillResult> {
  // Step 1: scrape the page for a direct email
  const { email: scrapedEmail, pageText } = await findCompanyEmail(request.applicationUrl);

  // Step 2: if not found, ask AI to deduce one
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

    return {
      success: false,
      status: 'failed',
      message: `Échec de l'envoi email (${result.error}). Vérifiez votre connexion et réessayez.`,
    };
  }

  // No email found by scraping nor by AI — Playwright automation is in standby
  return {
    success: false,
    status: 'unsupported',
    message: `Aucune adresse email trouvée pour cette offre (scraping + IA). Postulez directement via le lien : ${request.applicationUrl}`,
  };
}
