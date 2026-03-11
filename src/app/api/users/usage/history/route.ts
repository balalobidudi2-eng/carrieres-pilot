import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/users/usage/history — last 30 days of daily usage for the calling user */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    // Get last 30 days
    const rows = await prisma.dailyUsage.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
      select: {
        date: true,
        cvGeneration: true,
        coverLetter: true,
        aiMatching: true,
        autoApply: true,
        application: true,
        interviewQuestions: true,
        jobSearch: true,
      },
    });

    return NextResponse.json({ history: rows });
  } catch (err) {
    console.error('[users/usage/history]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
