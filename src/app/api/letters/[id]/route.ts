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

/** GET /api/letters/[id] — get a single letter */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const letter = await prisma.coverLetter.findFirst({ where: { id: params.id, userId } });
    if (!letter) return NextResponse.json({ error: 'Lettre introuvable' }, { status: 404 });
    return NextResponse.json(letter);
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({ error: 'Base de données inaccessible' }, { status: 503 });
    }
    console.error('[GET /api/letters/id]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/letters/[id] — update a letter */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();

  try {
    const letter = await prisma.coverLetter.findFirst({ where: { id: params.id, userId } });
    if (!letter) return NextResponse.json({ error: 'Lettre introuvable' }, { status: 404 });

    const updated = await prisma.coverLetter.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
        ...(body.companyName !== undefined && { companyName: body.companyName }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.tone !== undefined && { tone: body.tone }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({ error: 'Base de données inaccessible' }, { status: 503 });
    }
    console.error('[PATCH /api/letters/id]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/letters/[id] */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const letter = await prisma.coverLetter.findFirst({ where: { id: params.id, userId } });
    if (!letter) return NextResponse.json({ error: 'Lettre introuvable' }, { status: 404 });

    await prisma.coverLetter.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/letters/id]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
