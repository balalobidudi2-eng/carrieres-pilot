import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

/** GET /api/applications — list user applications */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 100;
  const status = req.nextUrl.searchParams.get('status') ?? undefined;

  const applications = await prisma.application.findMany({
    where: { userId, ...(status ? { status: status as never } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(limit, 200),
    include: { cv: { select: { id: true, name: true } }, letter: { select: { id: true, name: true } } },
  });

  return NextResponse.json(applications);
}

function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database") ||
    msg.includes('P1001') ||
    msg.includes('P1002') ||
    msg.includes('localhost:5432')
  );
}

/** POST /api/applications — create application */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const { company, jobTitle, jobUrl, jobOfferId, status, cvId, letterId, notes, nextStep, nextStepDate } = body;

  if (!company || !jobTitle) {
    return NextResponse.json({ error: 'company et jobTitle requis' }, { status: 400 });
  }

  // Duplicate check — detect by jobUrl OR company+jobTitle
  try {
    const orClauses: Record<string, unknown>[] = [
      { company: { equals: company, mode: 'insensitive' }, jobTitle: { equals: jobTitle, mode: 'insensitive' } },
    ];
    if (jobUrl) orClauses.unshift({ jobUrl });
    const duplicate = await prisma.application.findFirst({ where: { userId, OR: orClauses } });
    if (duplicate) {
      return NextResponse.json({ error: 'Vous avez déjà postulé à cette offre.' }, { status: 409 });
    }
  } catch { /* non-blocking */ }

  // Quota check — FREE: 3 manual applications/day
  try {
    const plan = await getUserPlan(userId);
    const quota = await checkQuota(userId, plan, 'application');
    if (!quota.allowed) {
      return NextResponse.json(
        { error: `Quota atteint — ${quota.max} candidature(s) manuelle(s) par jour pour votre offre. Passez à Pro pour en faire plus.` },
        { status: 429 },
      );
    }
  } catch { /* quota service optional — let the request through */ }

  try {
    const application = await prisma.application.create({
      data: {
        userId,
        company,
        jobTitle,
        jobUrl: jobUrl ?? null,
        jobOfferId: jobOfferId ?? null,
        status: status ?? 'TO_SEND',
        cvId: cvId ?? null,
        letterId: letterId ?? null,
        notes: notes ?? null,
        nextStep: nextStep ?? null,
        nextStepDate: nextStepDate ? new Date(nextStepDate) : null,
      },
    });
    await incrementUsage(userId, 'application').catch(() => {/* non-blocking */});
    return NextResponse.json(application, { status: 201 });
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      // Return a mock so the Kanban board still updates locally
      return NextResponse.json({
        id: `app-${Date.now()}`,
        userId, company, jobTitle,
        jobUrl: jobUrl ?? null,
        jobOfferId: jobOfferId ?? null,
        status: status ?? 'TO_SEND',
        cvId: cvId ?? null,
        letterId: letterId ?? null,
        notes: notes ?? null,
        nextStep: nextStep ?? null,
        nextStepDate: nextStepDate ?? null,
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 201 });
    }
    console.error('[POST /api/applications]', err);
    const code = (err as { code?: string })?.code;
    if (code === 'P2003') {
      return NextResponse.json({ error: 'Session expirée ou compte introuvable. Reconnectez-vous.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Erreur serveur lors de la création' }, { status: 500 });
  }
}
