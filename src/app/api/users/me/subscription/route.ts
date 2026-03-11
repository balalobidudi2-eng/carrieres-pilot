import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDailyUsageSummary } from '@/lib/quota-service';
import { prisma } from '@/lib/prisma';

/** GET /api/users/me/subscription — daily usage + plan info for the subscription bar */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    if (!user) return NextResponse.json({ error: 'Session expirée' }, { status: 401 });

    const summary = await getDailyUsageSummary(userId, user.plan);
    return NextResponse.json({ ...summary, renewalTime: 'minuit' });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

