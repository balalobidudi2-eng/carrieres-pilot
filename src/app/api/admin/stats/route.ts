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
      recentSignups,
      recentApplications,
    ] = await Promise.all([
      prisma.user.count({ where: { deletionScheduledAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletionScheduledAt: null } }),
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo }, deletionScheduledAt: null } }),
      prisma.user.groupBy({ by: ['plan'], _count: { id: true }, where: { deletionScheduledAt: null } }),
      prisma.cV.count(),
      prisma.coverLetter.count(),
      prisma.application.count(),
      prisma.dailyUsage.aggregate({ _sum: { jobSearch: true } }).then((r) => r._sum.jobSearch ?? 0),
      prisma.user.findMany({
        where: { deletionScheduledAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, firstName: true, lastName: true, email: true, plan: true, createdAt: true, lastLoginAt: true },
      }),
      prisma.application.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          jobTitle: true,
          company: true,
          status: true,
          createdAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const planDist = { FREE: 0, PRO: 0, EXPERT: 0 };
    for (const g of planDistribution) {
      planDist[g.plan as keyof typeof planDist] = g._count.id;
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
      recentSignups,
      recentApplications,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
