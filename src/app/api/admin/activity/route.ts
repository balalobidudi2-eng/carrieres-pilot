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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const usages = await prisma.dailyUsage.groupBy({
      by: ['date'],
      _sum: {
        cvGeneration: true,
        coverLetter: true,
        jobSearch: true,
        application: true,
        aiMatching: true,
        interviewQuestions: true,
      },
      where: { date: { gte: thirtyDaysAgo.toISOString().slice(0, 10) } },
      orderBy: { date: 'asc' },
    });

    // Global totals
    const totals = await prisma.dailyUsage.aggregate({
      _sum: {
        cvGeneration: true,
        coverLetter: true,
        jobSearch: true,
        application: true,
        aiMatching: true,
        interviewQuestions: true,
      },
    });

    return NextResponse.json({
      daily: usages.map((u) => ({
        date: u.date,
        cvGeneration: u._sum.cvGeneration ?? 0,
        coverLetter: u._sum.coverLetter ?? 0,
        jobSearch: u._sum.jobSearch ?? 0,
        application: u._sum.application ?? 0,
        aiMatching: u._sum.aiMatching ?? 0,
        interviewQuestions: u._sum.interviewQuestions ?? 0,
      })),
      totals: {
        cvGeneration: totals._sum.cvGeneration ?? 0,
        coverLetter: totals._sum.coverLetter ?? 0,
        jobSearch: totals._sum.jobSearch ?? 0,
        application: totals._sum.application ?? 0,
        aiMatching: totals._sum.aiMatching ?? 0,
        interviewQuestions: totals._sum.interviewQuestions ?? 0,
      },
    });
  } catch (err) {
    console.error('[admin/activity]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
