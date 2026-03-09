import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

/** POST /api/applications — create application */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const { company, jobTitle, jobUrl, jobOfferId, status, cvId, letterId, notes, nextStep, nextStepDate } = body;

  if (!company || !jobTitle) {
    return NextResponse.json({ error: 'company et jobTitle requis' }, { status: 400 });
  }

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

  return NextResponse.json(application, { status: 201 });
}
