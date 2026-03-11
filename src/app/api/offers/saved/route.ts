import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/offers/saved — returns saved offer IDs (default) or full objects if ?full=1 */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const full = req.nextUrl.searchParams.get('full') === '1';

  try {
    if (full) {
      const saved = await prisma.savedOffer.findMany({
        where: { userId },
        orderBy: { savedAt: 'desc' },
      });
      return NextResponse.json(saved);
    }
    const saved = await prisma.savedOffer.findMany({
      where: { userId },
      select: { offerId: true },
      orderBy: { savedAt: 'desc' },
    });
    return NextResponse.json(saved.map((s) => s.offerId));
  } catch (err: unknown) {
    console.error('[GET /api/offers/saved]', err);
    return NextResponse.json(full ? [] : []);
  }
}
