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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast30Days,
      activeUsersLast30Days,
      planDistribution,
      totalCVs,
      totalLetters,
      totalApplications,
      totalSearches,
    ] = await Promise.all([
      prisma.user.count({ where: { deletionScheduledAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletionScheduledAt: null } }),
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo }, deletionScheduledAt: null } }),
      prisma.user.groupBy({ by: ['plan'], _count: { id: true }, where: { deletionScheduledAt: null } }),
      prisma.cV.count(),
      prisma.coverLetter.count(),
      prisma.application.count(),
      // Sum jobSearch usage across all users
      prisma.dailyUsage.aggregate({ _sum: { jobSearch: true } }).then((r) => r._sum.jobSearch ?? 0),
    ]);

    const planDist = { FREE: 0, PRO: 0, EXPERT: 0 };
    for (const g of planDistribution) {
      planDist[g.plan] = g._count.id;
    }

    return NextResponse.json({
      totalUsers,
      newUsersLast30Days,
      activeUsersLast30Days,
      planDistribution: planDist,
      totalCVs,
      totalLetters,
      totalApplications,
      totalSearches,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
