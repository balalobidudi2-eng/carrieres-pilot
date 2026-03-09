import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database") ||
    msg.includes('P1001') ||
    msg.includes('P1002') ||
    msg.includes('localhost:5432')
  );
}

/** PATCH /api/cv/[id] — update CV content */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();

  // Fake IDs are locally-imported CVs when the DB was unreachable — return mock success
  if (params.id.startsWith('cv-import-')) {
    return NextResponse.json({
      id: params.id,
      userId,
      name: body.name ?? 'CV importé',
      template: body.template ?? 'modern',
      content: body.content ?? {},
      isDefault: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  try {
    const cv = await prisma.cV.findFirst({ where: { id: params.id, userId } });
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    const updated = await prisma.cV.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.template !== undefined && { template: body.template }),
        ...(body.content !== undefined && { content: body.content }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({
        id: params.id,
        userId,
        name: body.name ?? 'CV',
        template: body.template ?? 'modern',
        content: body.content ?? {},
        isDefault: false,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    console.error('[PATCH /api/cv/id]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/cv/[id] */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const cv = await prisma.cV.findFirst({ where: { id: params.id, userId } });
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    await prisma.cV.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/cv/id]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
