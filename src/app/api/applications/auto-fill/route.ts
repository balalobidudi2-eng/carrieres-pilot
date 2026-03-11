import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { autoFillApplicationForm, type FormFillRequest } from '@/lib/form-automation';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { PLANS } from '@/lib/plans';
import { prisma } from '@/lib/prisma';

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

  const body = await req.json() as Partial<FormFillRequest> & { offerTitle?: string; offerCompany?: string };
  if (!body.applicationUrl || !body.firstName || !body.lastName || !body.email) {
    return NextResponse.json({ error: 'Champs requis manquants (applicationUrl, firstName, lastName, email)' }, { status: 400 });
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
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    linkedinUrl: body.linkedinUrl,
    cvPdfUrl: body.cvPdfUrl ?? cvPdfUrl,
    coverLetterText: body.coverLetterText ?? coverLetterText,
    offerTitle: body.offerTitle,
    offerCompany: body.offerCompany,
    customFields: body.customFields,
    userId,
  };

  const result = await autoFillApplicationForm(request);

  // Only increment quota if actually submitted/sent (admins are exempt)
  if (result.success && !isAdmin) {
    await incrementUsage(userId, 'auto_apply');
  }

  return NextResponse.json(result, { status: result.success ? 200 : 501 });
}
