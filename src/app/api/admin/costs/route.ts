import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// gpt-4o-mini pricing (USD/1M tokens)
const INPUT_PER_M = 0.15;
const OUTPUT_PER_M = 0.60;

// Estimated tokens per action
const TOKENS = {
  cvGeneration:  { input: 800, output: 1200 },
  coverLetter:   { input: 600, output: 900  },
  aiMatching:    { input: 300, output: 200  },
  autoApply:     { input: 200, output: 100  },
  chat:          { input: 300, output: 200  },
};

function tokenCost(input: number, output: number) {
  return (input * INPUT_PER_M + output * OUTPUT_PER_M) / 1_000_000;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, 2);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${year}-${month}`;

  try {
    // Aggregate all usage for current month
    const totals = await prisma.dailyUsage.aggregate({
      where: { date: { startsWith: monthPrefix } },
      _sum: {
        cvGeneration: true,
        coverLetter: true,
        jobSearch: true,
        aiMatching: true,
        autoApply: true,
        application: true,
      },
    });

    const cv       = totals._sum.cvGeneration ?? 0;
    const letter   = totals._sum.coverLetter ?? 0;
    const matching = totals._sum.aiMatching ?? 0;
    const auto     = totals._sum.autoApply ?? 0;

    const cvCost       = cv * tokenCost(TOKENS.cvGeneration.input, TOKENS.cvGeneration.output);
    const letterCost   = letter * tokenCost(TOKENS.coverLetter.input, TOKENS.coverLetter.output);
    const matchingCost = matching * tokenCost(TOKENS.aiMatching.input, TOKENS.aiMatching.output);
    const autoCost     = auto * tokenCost(TOKENS.autoApply.input, TOKENS.autoApply.output);
    const totalAI      = cvCost + letterCost + matchingCost + autoCost;

    // Infrastructure estimates (static monthly costs)
    const infraCost = 0.05; // Vercel hobby + Neon free tier

    const totalUSD = totalAI + infraCost;
    const totalEUR = totalUSD * 0.92; // approx conversion

    // Per-user breakdown (top 10 by volume)
    const perUser = await prisma.dailyUsage.groupBy({
      by: ['userId'],
      where: { date: { startsWith: monthPrefix } },
      _sum: {
        cvGeneration: true,
        coverLetter: true,
        aiMatching: true,
        autoApply: true,
        application: true,
      },
      orderBy: { _sum: { cvGeneration: 'desc' } },
      take: 10,
    });

    const userIds = perUser.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, plan: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const perUserCosts = perUser.map((r) => {
      const cv2   = r._sum.cvGeneration ?? 0;
      const lett  = r._sum.coverLetter ?? 0;
      const match = r._sum.aiMatching ?? 0;
      const apps  = r._sum.autoApply ?? 0;
      const cost  = cv2 * tokenCost(TOKENS.cvGeneration.input, TOKENS.cvGeneration.output)
                  + lett * tokenCost(TOKENS.coverLetter.input, TOKENS.coverLetter.output)
                  + match * tokenCost(TOKENS.aiMatching.input, TOKENS.aiMatching.output)
                  + apps * tokenCost(TOKENS.autoApply.input, TOKENS.autoApply.output);
      return {
        userId: r.userId,
        email: userMap[r.userId]?.email ?? '?',
        plan: userMap[r.userId]?.plan ?? 'FREE',
        cvGeneration: cv2,
        coverLetter: lett,
        aiMatching: match,
        autoApply: apps,
        applications: r._sum.application ?? 0,
        costUSD: cost,
        costEUR: cost * 0.92,
      };
    });

    return NextResponse.json({
      month: `${year}-${month}`,
      breakdown: {
        cvCostEUR: cvCost * 0.92,
        letterCostEUR: letterCost * 0.92,
        matchingCostEUR: matchingCost * 0.92,
        autoCostEUR: autoCost * 0.92,
        infraCostEUR: infraCost * 0.92,
      },
      totals: {
        cv, letter, matching, auto,
        totalUSD,
        totalEUR,
      },
      perUserCosts,
    });
  } catch (err) {
    console.error('[admin/costs]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
