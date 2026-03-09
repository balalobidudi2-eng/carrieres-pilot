import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, 1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    // Plan distribution
    const planGroups = await prisma.user.groupBy({
      by: ['plan'],
      _count: { id: true },
      where: { deletionScheduledAt: null },
    });
    const planDist = { FREE: 0, PRO: 0, EXPERT: 0 };
    for (const g of planGroups) planDist[g.plan] = g._count.id;

    // Monthly new subscriptions (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, deletionScheduledAt: null },
      select: { plan: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const byMonth: Record<string, { month: string; FREE: number; PRO: number; EXPERT: number }> = {};
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[key]) byMonth[key] = { month: key, FREE: 0, PRO: 0, EXPERT: 0 };
      byMonth[key][u.plan]++;
    }

    return NextResponse.json({
      planDistribution: planDist,
      monthlySignups: Object.values(byMonth),
    });
  } catch (err) {
    console.error('[admin/subscriptions]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
