import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** PATCH /api/cv/[id] — update CV content */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const cv = await prisma.cV.findFirst({ where: { id: params.id, userId } });
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    const body = await req.json();
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
