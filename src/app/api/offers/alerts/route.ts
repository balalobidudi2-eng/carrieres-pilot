import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER_ID } from '@/lib/demo-user';

const BYPASS_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database") ||
    msg.includes('P1001') || msg.includes('P1002') || msg.includes('P1008') ||
    msg.includes('P2003') || msg.includes('P2021') ||
    msg.includes('localhost:5432')
  );
}

/** GET /api/offers/alerts — list user's job alerts */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (BYPASS_IDS.has(userId)) {
    return NextResponse.json([
      { id: 'alert-demo-1', keywords: 'Product Designer', location: 'Paris', frequency: 'daily', isActive: true },
    ]);
  }

  try {
    const alerts = await prisma.jobAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, keywords: true, location: true, frequency: true, isActive: true, createdAt: true },
    });
    return NextResponse.json(alerts);
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json([]);
    console.error('[GET /api/offers/alerts]', err);
    return NextResponse.json([]);
  }
}

/** POST /api/offers/alerts — create a job alert */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  let keywords: string, location: string | undefined, frequency: string | undefined;
  try {
    const body = await req.json();
    keywords = body.keywords;
    location = body.location;
    frequency = body.frequency;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  if (!keywords?.trim()) {
    return NextResponse.json({ error: 'Les mots-clés sont requis' }, { status: 400 });
  }

  if (BYPASS_IDS.has(userId)) {
    return NextResponse.json({
      ok: true, id: `alert-${Date.now()}`, keywords: keywords.trim(),
      location: location ?? '', frequency: frequency ?? 'daily', isActive: true,
    });
  }

  try {
    const alert = await prisma.jobAlert.create({
      data: {
        userId,
        keywords: keywords.trim(),
        location: location?.trim() ?? '',
        frequency: frequency ?? 'daily',
        isActive: true,
      },
    });
    return NextResponse.json({ ok: true, ...alert }, { status: 201 });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({
        ok: true, id: `alert-${Date.now()}`, keywords: keywords.trim(),
        location: location ?? '', frequency: frequency ?? 'daily', isActive: true,
      });
    }
    console.error('[POST /api/offers/alerts]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/offers/alerts?id=xxx — delete a job alert */
export async function DELETE(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const alertId = new URL(req.url).searchParams.get('id');
  if (!alertId) {
    return NextResponse.json({ error: "ID de l'alerte requis" }, { status: 400 });
  }

  if (BYPASS_IDS.has(userId)) {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.jobAlert.deleteMany({ where: { id: alertId, userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isDbConnectionError(err)) return NextResponse.json({ ok: true });
    console.error('[DELETE /api/offers/alerts]', err);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}
