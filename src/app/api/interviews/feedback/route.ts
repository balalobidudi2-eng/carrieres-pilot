import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInterviewFeedback } from '@/lib/openai-service';

/** POST /api/interviews/feedback — AI feedback on interview answer */
export async function POST(req: NextRequest) {
  try { requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI non configuré' }, { status: 503 });
  }

  const { question, answer } = await req.json();
  if (!question || !answer) {
    return NextResponse.json({ error: 'question et answer requis' }, { status: 400 });
  }

  const feedback = await generateInterviewFeedback(question, answer);
  return NextResponse.json({ feedback });
}
