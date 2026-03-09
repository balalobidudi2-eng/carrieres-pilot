import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInterviewQuestions } from '@/lib/openai-service';

/** POST /api/interviews/questions — generate interview questions via AI */
export async function POST(req: NextRequest) {
  try { requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

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
