import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

/** GET /api/users/usage — user's own usage stats for the current month */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const today = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;
  const monthPrefix = `${year}-${month}`;

  try {
    const [monthlyRaw, todayRaw, user] = await Promise.all([
      prisma.dailyUsage.aggregate({
        where: { userId, date: { startsWith: monthPrefix } },
        _sum: { cvGeneration: true, coverLetter: true, aiMatching: true, autoApply: true, application: true },
      }),
      prisma.dailyUsage.findUnique({
        where: { userId_date: { userId, date: today } },
        select: { cvGeneration: true, coverLetter: true, aiMatching: true, autoApply: true, application: true, jobSearch: true, interviewQuestions: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      }),
    ]);

    const plan = user?.plan ?? 'FREE';
    const planLimits = PLANS[plan];

    const monthly = {
      cvGeneration: monthlyRaw._sum.cvGeneration ?? 0,
      coverLetter: monthlyRaw._sum.coverLetter ?? 0,
      aiMatching: monthlyRaw._sum.aiMatching ?? 0,
      autoApply: monthlyRaw._sum.autoApply ?? 0,
      applications: monthlyRaw._sum.application ?? 0,
    };

    const daily = {
      cvGeneration: todayRaw?.cvGeneration ?? 0,
      coverLetter: todayRaw?.coverLetter ?? 0,
      jobSearch: todayRaw?.jobSearch ?? 0,
      aiMatching: todayRaw?.aiMatching ?? 0,
      autoApply: todayRaw?.autoApply ?? 0,
      application: todayRaw?.application ?? 0,
      interviewQuestions: todayRaw?.interviewQuestions ?? 0,
    };

    return NextResponse.json({
      plan,
      limits: planLimits,
      monthly,
      daily,
    });
  } catch (err) {
    console.error('[users/usage]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
