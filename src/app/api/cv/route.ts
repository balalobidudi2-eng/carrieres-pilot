import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** GET /api/cv — list user's CVs */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const cvs = await prisma.cV.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(cvs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes("Can't reach database") || msg.includes('P1001') || msg.includes('localhost:5432')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/cv — create a new CV */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  let body: { name?: string; template?: string; content?: object };
  try { body = await req.json(); } catch { body = {}; }

  try {
    const cv = await prisma.cV.create({
      data: {
        userId,
        name: body.name ?? 'Mon CV',
        template: body.template ?? 'modern',
        content: body.content ?? {},
      },
    });
    return NextResponse.json(cv, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes("Can't reach database") || msg.includes('P1001') || msg.includes('localhost:5432')) {
      return NextResponse.json({ error: 'Base de données inaccessible. Réessayez dans quelques instants.' }, { status: 503 });
    }
    if (msg.includes('P2003') || msg.includes('P2025') || msg.includes('Foreign key constraint')) {
      return NextResponse.json({ error: 'Session expirée, veuillez vous reconnecter.' }, { status: 401 });
    }
    console.error('[POST /api/cv]', err);
    return NextResponse.json({ error: msg || 'Erreur serveur' }, { status: 500 });
  }
}
