import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateCoverLetter } from '@/lib/openai-service';

/** Returns true if the error is a Prisma DB connection failure */
function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : '';
  return msg.includes("Can't reach database") || msg.includes('P1001') || msg.includes('localhost:5432');
}

/** GET /api/letters — list user's letters */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const letters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(letters);
  } catch (err: unknown) {
    if (isDbConnectionError(err)) return NextResponse.json([]);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST /api/letters — save a letter */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  let body: { name?: string; jobTitle?: string; company?: string; content?: string; tone?: string };
  try { body = await req.json(); } catch { body = {}; }

  try {
    const letter = await prisma.coverLetter.create({
      data: {
        userId,
        name: body.name ?? `${body.jobTitle ?? 'Poste'} — ${body.company ?? 'Entreprise'}`,
        jobTitle: body.jobTitle,
        companyName: body.company,
        content: body.content ?? '',
        tone: (body.tone as 'professional' | 'dynamic' | 'creative') ?? 'professional',
      },
    });
    return NextResponse.json(letter, { status: 201 });
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({ error: 'Base de données inaccessible. Réessayez dans quelques instants.' }, { status: 503 });
    }
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('P2003') || msg.includes('P2025') || msg.includes('Foreign key constraint')) {
      return NextResponse.json({ error: 'Session expirée, veuillez vous reconnecter.' }, { status: 401 });
    }
    console.error('[POST /api/letters]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
