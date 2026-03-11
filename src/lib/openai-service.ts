import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ─── CV Summary ──────────────────────────────────────────────────────

export async function generateCVSummary(cvContent: Record<string, unknown>): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Tu es un expert RH spécialisé en rédaction de CV professionnels français. Réponds uniquement avec le texte demandé, sans guillemets ni formatage markdown.',
      },
      {
        role: 'user',
        content: `Rédige un résumé professionnel percutant en 3-4 phrases (max 80 mots) à la première personne, basé sur ce CV :\n\n${JSON.stringify(cvContent)}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Cover Letter ────────────────────────────────────────────────────

interface LetterInput {
  jobTitle: string;
  company?: string;
  jobDescription: string;
  tone: 'professional' | 'dynamic' | 'creative';
  userProfile?: Record<string, unknown>;
}

export async function generateCoverLetter(input: LetterInput): Promise<string> {
  const toneInstructions = {
    professional: 'Ton formel, structuré, axé compétences et résultats mesurables.',
    dynamic: 'Ton engagé, proactif, enthousiaste. Montre de la motivation.',
    creative: 'Ton original, mémorable et distinctif. Ose une ouverture créative.',
  };

  // Build a readable profile block from available data
  const p = input.userProfile as Record<string, unknown> | undefined;
  const profileLines: string[] = [];
  const fullName = [p?.firstName, p?.lastName].filter(Boolean).join(' ');
  if (fullName)             profileLines.push(`- Nom complet : ${fullName}`);
  if (p?.currentTitle)     profileLines.push(`- Titre actuel : ${p.currentTitle}`);
  if (p?.location)         profileLines.push(`- Ville : ${p.location}`);
  if (p?.phone)            profileLines.push(`- Téléphone : ${p.phone}`);
  if (Array.isArray(p?.skills) && (p.skills as string[]).length)
                           profileLines.push(`- Compétences : ${(p.skills as string[]).join(', ')}`);
  if (p?.bio)              profileLines.push(`- Résumé : ${p.bio}`);
  if (Array.isArray(p?.targetSectors) && (p.targetSectors as string[]).length)
                           profileLines.push(`- Secteurs cibles : ${(p.targetSectors as string[]).join(', ')}`);

  const profileBlock = profileLines.length
    ? profileLines.join('\n')
    : 'Profil non renseigné — génère une lettre générique professionnelle.';

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Tu es un expert RH français spécialisé en rédaction de lettres de motivation professionnelles. ${toneInstructions[input.tone]}
Règles OBLIGATOIRES :
1. INTERDICTION ABSOLUE d'écrire des placeholders entre crochets : [Adresse], [Ville], [Date], [Nom], [Entreprise], [Téléphone], etc. Si une info manque, ne l'écris pas du tout.
2. Commence DIRECTEMENT par "Objet :" sans rien avant.
3. Utilise les VRAIES données du profil fournies ci-dessous.
4. Si le nom de l'entreprise n'est pas fourni, écris "Madame, Monsieur," sans mentionner d'entreprise.
5. Longueur cible : 300 à 380 mots.
6. Format texte simple, paragraphes bien séparés, PAS de guillemets autour de la lettre.`,
      },
      {
        role: 'user',
        content: `Rédige une lettre de motivation pour le poste de "${input.jobTitle}"${input.company ? ` chez "${input.company}"` : ''}.

Description du poste :
${input.jobDescription}

Données du candidat (utilise ces informations directement) :
${profileBlock}

Structure imposée :
Objet : Candidature au poste de [titre issu de la description]

Madame, Monsieur,

[Paragraphe 1 — accroche et motivation : 3 phrases]

[Paragraphe 2 — compétences et expériences : 3-4 phrases]

[Paragraphe 3 — valeur ajoutée et disponibilité : 2-3 phrases]

Dans l'attente de votre retour, je vous adresse, Madame, Monsieur, mes sincères salutations.

${fullName || 'Le candidat'}`,
      },
    ],
    max_tokens: 900,
    temperature: 0.72,
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Interview Questions ─────────────────────────────────────────────

export async function generateInterviewQuestions(sector: string, level: string): Promise<Array<{
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'situational';
  tip: string;
}>> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un coach en préparation d\'entretiens d\'embauche. Réponds uniquement en JSON valide, sans markdown.',
      },
      {
        role: 'user',
        content: `Génère 8 questions d'entretien pour un profil ${level} dans le secteur ${sector}.
Mix de questions comportementales, techniques et situationnelles.
Inclus un conseil pratique pour chaque question.

Réponds avec un tableau JSON :
[{"id":"1","question":"...","category":"behavioral|technical|situational","tip":"..."}]`,
      },
    ],
    max_tokens: 1200,
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.questions ?? [];
}

// ─── Interview Feedback ─────────────────────────────────────────────

export async function generateInterviewFeedback(question: string, answer: string): Promise<{
  score: number;
  clarity: number;
  structure: number;
  relevance: number;
  technical: number;
  summary: string;
}> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Tu es un coach carrière expert. Analyse la réponse du candidat à une question d'entretien. 
Réponds UNIQUEMENT en JSON strict avec ce format :
{"score":8,"clarity":7,"structure":8,"relevance":9,"technical":7,"summary":"Feedback constructif en 2-3 phrases."}
Scores de 1 à 10. Sois honnête et constructif.`,
      },
      {
        role: 'user',
        content: `Question : "${question}"\n\nRéponse du candidat : "${answer}"`,
      },
    ],
    max_tokens: 400,
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });
  const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
  const parsed = JSON.parse(raw);
  return {
    score: parsed.score ?? 5,
    clarity: parsed.clarity ?? 5,
    structure: parsed.structure ?? 5,
    relevance: parsed.relevance ?? 5,
    technical: parsed.technical ?? 5,
    summary: parsed.summary ?? raw,
  };
}

// ─── Offer Matching ──────────────────────────────────────────────────

export async function scoreOfferMatch(
  userProfile: Record<string, unknown>,
  offer: { title: string; description: string; requirements?: string[] },
): Promise<{ score: number; strengths: string[]; gaps: string[] }> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert RH. Note la compatibilité profil/offre de 0 à 100. Réponds en JSON strict.',
      },
      {
        role: 'user',
        content: `Évalue la compatibilité entre ce profil et cette offre.

PROFIL : ${JSON.stringify(userProfile)}

OFFRE : ${JSON.stringify(offer)}

Réponds en JSON : {"score": 82, "strengths": ["..."], "gaps": ["..."]}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? '{"score":50,"strengths":[],"gaps":[]}';
  return JSON.parse(raw);
}
