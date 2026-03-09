import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** GET /api/applications/stats — dashboard statistics */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Demo user — return realistic mock data
  if (userId === DEMO_USER_ID) {
    return NextResponse.json({
      totalApplications: 12,
      responseRate: 42,
      interviewsCount: 3,
      pendingCount: 5,
      byStatus: { TO_SEND: 2, SENT: 3, VIEWED: 2, INTERVIEW_SCHEDULED: 2, INTERVIEW_DONE: 1, OFFER_RECEIVED: 1, REJECTED: 1 },
      weeklyData: [
        { week: 'S-3', count: 2 },
        { week: 'S-2', count: 4 },
        { week: 'S-1', count: 3 },
        { week: 'S-0', count: 3 },
      ],
    });
  }

  try {
  const [total, byStatus] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));

  const responded = (statusMap.VIEWED ?? 0) + (statusMap.INTERVIEW_SCHEDULED ?? 0) +
    (statusMap.INTERVIEW_DONE ?? 0) + (statusMap.OFFER_RECEIVED ?? 0) +
    (statusMap.ACCEPTED ?? 0) + (statusMap.REJECTED ?? 0);
  const sent = total - (statusMap.TO_SEND ?? 0);
  const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

  const interviewsCount = (statusMap.INTERVIEW_SCHEDULED ?? 0) + (statusMap.INTERVIEW_DONE ?? 0);
  const pendingCount = (statusMap.SENT ?? 0) + (statusMap.VIEWED ?? 0);

  // Weekly chart data (last 4 weeks)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const recentApps = await prisma.application.findMany({
    where: { userId, createdAt: { gte: fourWeeksAgo } },
    select: { createdAt: true },
  });

  const weeklyData: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const count = recentApps.filter((a) => a.createdAt >= weekStart && a.createdAt < weekEnd).length;
    weeklyData.push({ week: `S-${i}`, count });
  }

  return NextResponse.json({
    totalApplications: total,
    responseRate,
    interviewsCount,
    pendingCount,
    byStatus: statusMap,
    weeklyData,
  });
  } catch {
    return NextResponse.json({
      totalApplications: 0, responseRate: 0, interviewsCount: 0, pendingCount: 0,
      byStatus: {}, weeklyData: [{ week: 'S-3', count: 0 }, { week: 'S-2', count: 0 }, { week: 'S-1', count: 0 }, { week: 'S-0', count: 0 }],
    });
  }
}
