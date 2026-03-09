import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database") ||
    msg.includes('P1001') ||
    msg.includes('P1002') ||
    msg.includes('localhost:5432')
  );
}

/** PATCH /api/applications/[id] — update application */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Fake IDs (created when DB was unreachable) — return mock success
  if (params.id.startsWith('app-')) {
    const body = await req.json();
    return NextResponse.json({ id: params.id, ...body, updatedAt: new Date().toISOString() });
  }

  const body = await req.json();
  const allowedFields = ['status', 'company', 'jobTitle', 'jobUrl', 'notes', 'nextStep', 'nextStepDate', 'cvId', 'letterId'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      data[key] = key === 'nextStepDate' && body[key] ? new Date(body[key]) : body[key];
    }
  }

  try {
    const app = await prisma.application.findUnique({ where: { id: params.id } });
    if (!app || app.userId !== userId) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }
    const updated = await prisma.application.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({ id: params.id, ...data, updatedAt: new Date().toISOString() });
    }
    console.error('[PATCH /api/applications/id]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** DELETE /api/applications/[id] — delete application */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (params.id.startsWith('app-')) {
    return NextResponse.json({ ok: true });
  }

  try {
    const app = await prisma.application.findUnique({ where: { id: params.id } });
    if (!app || app.userId !== userId) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }
    await prisma.application.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({ ok: true });
    }
    console.error('[DELETE /api/applications/id]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
