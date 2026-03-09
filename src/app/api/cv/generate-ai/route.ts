import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';

// This route calls OpenAI server-side — the API key never reaches the browser.
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY non configurée. Ajoutez-la dans .env.local.' },
      { status: 503 },
    );
  }

  // Quota check (skip DB for demo user)
  const plan = await getUserPlan(userId);
  const quota = userId === DEMO_USER_ID
    ? { allowed: true, used: 0, max: 5, remaining: 5 }
    : await checkQuota(userId, plan, 'cv_generation');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne atteinte (${quota.max} tâches/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  let body: { type: string; cvId?: string; content?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { type, content } = body;

  const prompts: Record<string, string> = {
    summary: `Tu es un expert en recrutement RH français. En te basant sur le contenu de CV suivant, rédige un résumé professionnel percutant en 3-4 phrases (max 80 mots). Le résumé doit être à la première personne, dynamique, et mettre en valeur les points forts du candidat. Réponds uniquement avec le texte du résumé, sans guillemets ni formatage.

Contenu du CV :
${JSON.stringify(content ?? {}, null, 2)}`,
  };

  const prompt = prompts[type];
  if (!prompt) {
    return NextResponse.json({ error: `Type "${type}" non supporté` }, { status: 400 });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? 'Erreur OpenAI' },
        { status: openaiRes.status },
      );
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';

    // Increment usage after successful generation
    if (userId !== DEMO_USER_ID) {
      await incrementUsage(userId, 'cv_generation');
    }

    return NextResponse.json({ summary: text }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Impossible de contacter OpenAI' }, { status: 502 });
  }
}
