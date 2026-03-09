import { prisma } from './prisma';
import { PLANS, type PlanLimits } from './plans';
import { DEMO_USER_ID, DEMO_USER } from './demo-user';

export type QuotaKey = keyof PlanLimits;

/** Map quota keys to DailyUsage DB column names */
const QUOTA_DB_FIELD: Record<QuotaKey, string> = {
  cv_generation: 'cvGeneration',
  cover_letter: 'coverLetter',
  job_search: 'jobSearch',
  ai_matching: 'aiMatching',
  auto_apply: 'autoApply',
};

/** Get today's date string in Europe/Paris timezone */
function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
}

/** Get or create today's usage record for a user */
async function getOrCreateUsage(userId: string) {
  const date = todayStr();
  return prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  });
}

/** Check if user can perform an action, returns { allowed, used, max } */
export async function checkQuota(
  userId: string,
  plan: string,
  action: QuotaKey,
): Promise<{ allowed: boolean; used: number; max: number; remaining: number }> {
  const planConfig = PLANS[plan] ?? PLANS.FREE;
  const max = planConfig.dailyLimits[action];

  // Feature disabled for this plan
  if (max === 0) {
    return { allowed: false, used: 0, max: 0, remaining: 0 };
  }

  const usage = await getOrCreateUsage(userId);
  const field = QUOTA_DB_FIELD[action] as keyof typeof usage;
  const used = (usage[field] as number) ?? 0;

  return {
    allowed: used < max,
    used,
    max,
    remaining: Math.max(0, max - used),
  };
}

/** Increment usage counter after a successful action */
export async function incrementUsage(userId: string, action: QuotaKey): Promise<void> {
  const date = todayStr();
  const field = QUOTA_DB_FIELD[action];
  await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

/** Get full usage summary for today (for subscription bar) */
export async function getDailyUsageSummary(userId: string, plan: string) {
  const planConfig = PLANS[plan] ?? PLANS.FREE;
  const usage = await getOrCreateUsage(userId);

  const items = (Object.keys(QUOTA_DB_FIELD) as QuotaKey[]).map((key) => {
    const field = QUOTA_DB_FIELD[key] as keyof typeof usage;
    const used = (usage[field] as number) ?? 0;
    const max = planConfig.dailyLimits[key];
    return {
      key,
      used,
      max,
      remaining: Math.max(0, max - used),
      enabled: max > 0,
    };
  });

  return {
    plan: planConfig.id,
    planName: planConfig.name,
    date: usage.date,
    items,
  };
}

/** Resolve the plan name for a user (handles demo user without DB) */
export async function getUserPlan(userId: string): Promise<string> {
  if (userId === DEMO_USER_ID) return DEMO_USER.plan;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return user?.plan ?? 'FREE';
}
