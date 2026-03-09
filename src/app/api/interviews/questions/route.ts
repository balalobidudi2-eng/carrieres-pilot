import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInterviewQuestions } from '@/lib/openai-service';
import { getUserPlan } from '@/lib/quota-service';
import { PLANS } from '@/lib/plans';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** POST /api/interviews/questions — generate interview questions via AI */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Plan check — interview questions are PRO/EXPERT only
  const plan = userId === DEMO_USER_ID ? 'PRO' : await getUserPlan(userId).catch(() => 'FREE');
  const limit = PLANS[plan]?.dailyLimits?.interview_questions ?? 0;
  if (limit === 0) {
    return NextResponse.json(
      { error: 'La préparation aux entretiens est réservée aux plans Pro et Expert. Passez à un plan supérieur pour débloquer cette fonctionnalité.' },
      { status: 403 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI non configuré' }, { status: 503 });
  }

  const { sector, level } = await req.json();
  if (!sector || !level) {
    return NextResponse.json({ error: 'sector et level requis' }, { status: 400 });
  }

  const questions = await generateInterviewQuestions(sector, level);
  return NextResponse.json({ questions });
}
