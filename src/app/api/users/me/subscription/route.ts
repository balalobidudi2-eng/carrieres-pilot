import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { DEMO_USER_ID } from '@/lib/demo-user';
import { PLANS } from '@/lib/plans';
import { getDailyUsageSummary } from '@/lib/quota-service';
import { prisma } from '@/lib/prisma';

const TEST_USER_PLANS: Record<string, 'FREE' | 'PRO' | 'EXPERT'> = {
  'test-free': 'FREE',
  'test-pro': 'PRO',
  'test-expert': 'EXPERT',
};

/** GET /api/users/me/subscription — daily usage + plan info for the subscription bar */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Demo user: return mock subscription data without DB
  if (userId === DEMO_USER_ID) {
    const plan = PLANS.PRO;
    return NextResponse.json({
      plan: plan.id,
      planName: plan.name,
      date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }),
      items: [
        { key: 'cv_generation', used: 2, max: 5, remaining: 3, enabled: true },
        { key: 'cover_letter', used: 1, max: 5, remaining: 4, enabled: true },
        { key: 'job_search', used: 15, max: 100, remaining: 85, enabled: true },
        { key: 'ai_matching', used: 8, max: 50, remaining: 42, enabled: true },
        { key: 'auto_apply', used: 3, max: 10, remaining: 7, enabled: true },
      ],
      renewalTime: 'minuit',
    });
  }

  // Test accounts: return mock subscription data based on plan
  const testPlan = TEST_USER_PLANS[userId];
  if (testPlan) {
    const plan = PLANS[testPlan];
    const lim = plan.dailyLimits;
    return NextResponse.json({
      plan: plan.id,
      planName: plan.name,
      date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }),
      items: [
        { key: 'cv_generation', used: 0, max: lim.cv_generation, remaining: lim.cv_generation, enabled: lim.cv_generation > 0 },
        { key: 'cover_letter', used: 0, max: lim.cover_letter, remaining: lim.cover_letter, enabled: lim.cover_letter > 0 },
        { key: 'job_search', used: 0, max: lim.job_search, remaining: lim.job_search, enabled: lim.job_search > 0 },
        { key: 'ai_matching', used: 0, max: lim.ai_matching, remaining: lim.ai_matching, enabled: lim.ai_matching > 0 },
        { key: 'auto_apply', used: 0, max: lim.auto_apply, remaining: lim.auto_apply, enabled: lim.auto_apply > 0 },
      ],
      renewalTime: 'minuit',
    });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { plan: true },
    });

    const summary = await getDailyUsageSummary(userId, user.plan);
    return NextResponse.json({ ...summary, renewalTime: 'minuit' });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
