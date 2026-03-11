import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInterviewFeedback } from '@/lib/openai-service';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

/** POST /api/interviews/feedback — AI feedback on interview answer */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI non configuré' }, { status: 503 });
  }

  // Quota check — reuses interview_questions limit (FREE=0, PRO=2×8=16, EXPERT=unlimited)
  const plan = await getUserPlan(userId).catch(() => 'FREE');
  const quota = await checkQuota(userId, plan, 'interview_questions').catch(() => ({ allowed: true, used: 0, max: 999, remaining: 999 }));
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de feedbacks atteinte (${quota.max}/jour). Passez au plan supérieur.` },
      { status: 429 },
    );
  }

  const { question, answer } = await req.json();
  if (!question || !answer) {
    return NextResponse.json({ error: 'question et answer requis' }, { status: 400 });
  }

  const feedback = await generateInterviewFeedback(question, answer);
  await incrementUsage(userId, 'interview_questions').catch(() => null);
  return NextResponse.json({ feedback });
}
