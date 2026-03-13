import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { autoFillApplicationForm, type FormFillRequest } from '@/lib/form-automation';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { PLANS } from '@/lib/plans';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { detectSiteFromUrl, testExternalLogin, loginWithCookies } from '@/lib/playwright-login';

/** POST /api/applications/auto-fill — auto-fill an online application form */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Admin users bypass all plan gates and quotas
  const adminUser = await prisma.user.findUnique({ where: { id: userId }, select: { adminLevel: true } });
  const isAdmin = (adminUser?.adminLevel ?? 0) >= 1;

  if (!isAdmin) {
    // Feature gate: auto_apply must be enabled for the user's plan
    const plan = await getUserPlan(userId);
    const planConfig = PLANS[plan] ?? PLANS.FREE;
    if (!planConfig.features.auto_apply) {
      return NextResponse.json(
        { error: 'La candidature automatique n\'est pas disponible sur votre plan. Passez au Pro ou Expert.' },
        { status: 403 },
      );
    }

    // Quota check
    const quota = await checkQuota(userId, plan, 'auto_apply');
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Limite quotidienne atteinte (${quota.max} candidatures auto/jour). Réessayez demain ou passez au plan supérieur.` },
        { status: 429 },
      );
    }
  }

  // Keep plan variable for non-admin quota increment below
  const plan = isAdmin ? 'FREE' : await getUserPlan(userId);

  const body = await req.json() as Partial<FormFillRequest> & { offerTitle?: string; offerCompany?: string; mode?: 'smtp' | 'playwright' | 'both' };
  const applyMode = body.mode ?? 'both';

  if (!body.applicationUrl) {
    return NextResponse.json({ error: 'applicationUrl est requis' }, { status: 400 });
  }

  // ─── Auto-login with stored external credentials ───────────────────────────
  // Only for Playwright mode — SMTP doesn't need a pre-authenticated session
  if (applyMode !== 'smtp') {
    const site = detectSiteFromUrl(body.applicationUrl);
    const externalAccount = await prisma.externalAccount.findFirst({
      where: { userId, site },
    }).catch(() => null);

    if (externalAccount) {
      // Try to reuse saved cookies first (faster, avoids re-login)
      let sessionReused = false;
      if (externalAccount.cookiesJson) {
        const session = await loginWithCookies(body.applicationUrl, externalAccount.cookiesJson);
        if (session) {
          await session.browser.close();
          sessionReused = true;
          console.log(`[auto-fill] Session cookies reused for ${site}`);
        }
      }

      // If cookies are expired or missing, perform a fresh login
      if (!sessionReused) {
        let password: string;
        try {
          password = decrypt(externalAccount.passwordHash);
        } catch {
          console.warn('[auto-fill] Could not decrypt external account password — continuing without pre-login');
          password = '';
        }

        if (password) {
          const loginResult = await testExternalLogin({
            loginUrl: externalAccount.loginUrl,
            email: externalAccount.email,
            password,
            site,
          });

          if (loginResult.success) {
            // Persist refreshed cookies for next request
            await prisma.externalAccount.update({
              where: { id: externalAccount.id },
              data: {
                cookiesJson: loginResult.cookies ? JSON.stringify(loginResult.cookies) : null,
                isValid: true,
                lastLoginAt: new Date(),
              },
            }).catch(() => null);
            console.log(`[auto-fill] Fresh login succeeded for ${site}`);
          } else {
            // Non-fatal: return a clear message so user can update credentials
            return NextResponse.json({
              success: false,
              requiresManual: false,
              message: `Connexion automatique échouée sur ${externalAccount.siteLabel} : ${loginResult.message}. Vérifiez vos identifiants dans "Comptes externes".`,
              settingsUrl: '/comptes-externes',
            }, { status: 200 });
          }
        }
      }
    }
    // No external account for this site — proceed normally (Playwright will try
    // as a guest; many sites allow browsing without login)
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Use values from request body, fall back to the authenticated user's profile in DB
  let firstName = body.firstName?.trim() || '';
  let lastName = body.lastName?.trim() || '';
  let email = body.email?.trim() || '';

  if (!firstName || !lastName || !email) {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    firstName = firstName || userProfile?.firstName?.trim() || '';
    lastName = lastName || userProfile?.lastName?.trim() || '';
    email = email || userProfile?.email?.trim() || '';
  }

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: 'Prénom, nom et email introuvables. Complétez votre profil avant de postuler.' },
      { status: 400 },
    );
  }

  // Fetch the user's most useful CV (default first, then most recently updated)
  let cvPdfUrl: string | undefined;
  try {
    const cv = await prisma.cV.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    if (cv?.pdfUrl) cvPdfUrl = cv.pdfUrl;
  } catch { /* DB unavailable — proceed without CV attachment */ }

  // Fetch the user's most recent cover letter
  let coverLetterText: string | undefined;
  try {
    const letter = await prisma.coverLetter.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (letter?.content?.trim()) coverLetterText = letter.content;
  } catch { /* DB unavailable — proceed without cover letter */ }

  const request: FormFillRequest = {
    applicationUrl: body.applicationUrl,
    firstName,
    lastName,
    email,
    phone: body.phone,
    linkedinUrl: body.linkedinUrl,
    cvPdfUrl: body.cvPdfUrl ?? cvPdfUrl,
    coverLetterText: body.coverLetterText ?? coverLetterText,
    offerTitle: body.offerTitle,
    offerCompany: body.offerCompany,
    customFields: body.customFields,
    userId,
  };

  const result = await autoFillApplicationForm(request, applyMode);

  // Only increment quota if actually submitted/sent (admins are exempt)
  if (result.success && !isAdmin) {
    await incrementUsage(userId, 'auto_apply');
  }

  // requiresManual is an expected outcome (no automatable form), not a server error — return 200
  return NextResponse.json(result, { status: result.success || result.requiresManual ? 200 : 501 });
}
