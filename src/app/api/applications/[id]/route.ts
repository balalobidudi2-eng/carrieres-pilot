import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** PATCH /api/applications/[id] — update application */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app || app.userId !== userId) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }

  const body = await req.json();
  const allowedFields = ['status', 'company', 'jobTitle', 'jobUrl', 'notes', 'nextStep', 'nextStepDate', 'cvId', 'letterId'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      data[key] = key === 'nextStepDate' && body[key] ? new Date(body[key]) : body[key];
    }
  }

  const updated = await prisma.application.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

/** DELETE /api/applications/[id] — delete application */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app || app.userId !== userId) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }

  await prisma.application.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
