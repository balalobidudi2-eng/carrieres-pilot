import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `Tu es l'assistant de support de CarrièrePilot, une plateforme française d'aide à la recherche d'emploi par l'IA. Voici ce que propose CarrièrePilot :
- Création et optimisation de CV (score ATS, suggestions IA)
- Génération de lettres de motivation personnalisées
- Recherche d'offres d'emploi via France Travail
- Candidature automatique par email (plans PRO/EXPERT)
- Suivi des candidatures en kanban (pipeline)
- Préparation aux entretiens avec scoring IA (critères : clarté, structure, pertinence, technique)
- Configuration SMTP personnalisée pour les envois automatiques
- Administration des utilisateurs (plan ADMIN)

Abonnements : FREE (limité), PRO à 14,99€/mois (50 candidatures auto/jour, 10 CV, 20 lettres), EXPERT à 29,99€/mois (illimité + support prioritaire). Tarifs annuels disponibles (-20%).

Réponds uniquement en français, de façon concise et utile. Limite-toi à 3 phrases maximum sauf pour les questions techniques complexes. Redirige vers les paramètres de l'app quand c'est pertinent (/parametres/smtp pour la config email, /abonnement pour les plans). Ne discute pas de sujets non liés à CarrièrePilot ou à la recherche d'emploi.`;

export async function POST(req: NextRequest) {
  try { requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages requis' }, { status: 400 });
  }

  // Validate message structure and sanitize (keep only last 10 to limit tokens)
  const recentMessages = messages.slice(-10).map((m: unknown) => {
    const msg = m as { role?: string; content?: string };
    return { role: msg.role === 'user' ? 'user' : 'assistant', content: String(msg.content ?? '') };
  }) as Array<{ role: 'user' | 'assistant'; content: string }>;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...recentMessages],
    max_tokens: 300,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? 'Désolé, je n\'ai pas pu générer une réponse.';
  const usage = completion.usage;
  return NextResponse.json({
    reply,
    usage: usage ? {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    } : null,
  });
}
