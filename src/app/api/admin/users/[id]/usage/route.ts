import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req, 2);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    const usage = await prisma.dailyUsage.aggregate({
      where: { userId: params.id },
      _sum: {
        cvGeneration: true,
        coverLetter: true,
        jobSearch: true,
        aiMatching: true,
        autoApply: true,
        application: true,
      },
    });

    const INPUT_PER_M = 0.15;
    const OUTPUT_PER_M = 0.60;
    const cv   = usage._sum.cvGeneration ?? 0;
    const lett = usage._sum.coverLetter ?? 0;
    const match = usage._sum.aiMatching ?? 0;
    const auto = usage._sum.autoApply ?? 0;

    const tokenCount = cv * 2000 + lett * 1500 + match * 500 + auto * 300;
    const costUSD = (cv * (800 * INPUT_PER_M + 1200 * OUTPUT_PER_M)
      + lett * (600 * INPUT_PER_M + 900 * OUTPUT_PER_M)
      + match * (300 * INPUT_PER_M + 200 * OUTPUT_PER_M)
      + auto * (200 * INPUT_PER_M + 100 * OUTPUT_PER_M)) / 1_000_000;

    return NextResponse.json({
      userId: params.id,
      totalTokens: tokenCount,
      cvGeneration: cv,
      coverLetter: lett,
      jobSearch: usage._sum.jobSearch ?? 0,
      aiMatching: match,
      autoApply: auto,
      applications: usage._sum.application ?? 0,
      costUSD,
      costEUR: costUSD * 0.92,
    });
  } catch (err) {
    console.error('[admin/users/:id/usage]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
