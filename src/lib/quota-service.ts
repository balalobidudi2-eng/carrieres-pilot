import { prisma } from './prisma';
import { PLANS, type PlanLimits } from './plans';

export type QuotaKey = keyof PlanLimits;

function isDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database") ||
    msg.includes('P1001') || msg.includes('P1002') || msg.includes('P1008') ||
    msg.includes('P2003') || msg.includes('P2021') ||
    msg.includes('localhost:5432')
  );
}

/** Map quota keys to DailyUsage DB column names */
const QUOTA_DB_FIELD: Record<QuotaKey, string> = {
  cv_generation: 'cvGeneration',
  cover_letter: 'coverLetter',
  job_search: 'jobSearch',
  ai_matching: 'aiMatching',
  auto_apply: 'autoApply',
  interview_questions: 'interviewQuestions',
  application: 'application',
};

/** Get today's date string in Europe/Paris timezone */
function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
}

/** Fallback usage object when DB is unreachable.
 *  Dev: returns 0 so all actions are allowed.
 *  Prod: returns a high value so all actions are blocked (fail-safe). */
function fallbackUsage() {
  const maxValue = process.env.NODE_ENV === 'production' ? 9999 : 0;
  return {
    cvGeneration: maxValue,
    coverLetter: maxValue,
    jobSearch: maxValue,
    aiMatching: maxValue,
    autoApply: maxValue,
    interviewQuestions: maxValue,
    application: maxValue,
    date: todayStr(),
  };
}

/** Get or create today's usage record for a user */
async function getOrCreateUsage(userId: string) {
  const date = todayStr();
  try {
    return await prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date },
      update: {},
    });
  } catch (err) {
    if (isDbError(err)) {
      // In production: throw so the route-level .catch() can return { allowed: true }
      // In local dev: return fallback (0) so dev works without a running DB
      if (process.env.NODE_ENV === 'production') throw err;
      return fallbackUsage();
    }
    throw err;
  }
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
  try {
    await prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  } catch (err) {
    if (isDbError(err)) return; // silently skip if DB unreachable locally
    throw err;
  }
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

/** Resolve the plan name for a user */
export async function getUserPlan(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    return user?.plan ?? 'FREE';
  } catch (err) {
    if (isDbError(err)) return 'FREE'; // default plan when DB unreachable locally
    throw err;
  }
}
