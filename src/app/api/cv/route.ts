import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEMO_USER_ID } from '@/lib/demo-user';

const DEMO_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

const DEMO_CVS = [
  { id: 'demo-cv-1', name: 'CV Product Designer', template: 'modern', atsScore: 82, content: {}, createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
];

/** GET /api/cv — list user's CVs */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (DEMO_IDS.has(userId)) return NextResponse.json(DEMO_CVS);

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
      return NextResponse.json({
        id: `cv-${Date.now()}`, userId,
        name: body.name ?? 'Mon CV', template: body.template ?? 'modern',
        content: body.content ?? {}, atsScore: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }, { status: 201 });
    }
    console.error('[POST /api/cv]', err);
    return NextResponse.json({ error: msg || 'Erreur serveur' }, { status: 500 });
  }
}
