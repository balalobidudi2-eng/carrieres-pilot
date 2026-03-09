import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER_ID } from '@/lib/demo-user';

const DEMO_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

/** GET /api/offers/saved — returns saved offer IDs for the current user */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (DEMO_IDS.has(userId)) {
    return NextResponse.json([]);
  }

  try {
    const saved = await prisma.savedOffer.findMany({
      where: { userId },
      select: { offerId: true },
      orderBy: { savedAt: 'desc' },
    });
    return NextResponse.json(saved.map((s) => s.offerId));
  } catch (err: unknown) {
    console.error('[GET /api/offers/saved]', err);
    return NextResponse.json([]);
  }
}
