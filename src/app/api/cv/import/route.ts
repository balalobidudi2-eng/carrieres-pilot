import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEMO_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

function isDbConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Can't reach database") || msg.includes('P1001') || msg.includes('localhost:5432');
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }

  if (name.endsWith('.pdf')) {
    // pdf-parse is a CJS module; use require to avoid ESM .default issue
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error('Format non supporté. Utilisez .txt, .pdf ou .docx');
}

const CV_PROMPT = (text: string) => `Tu es un parseur de CV expert. Extrais les informations structurées du texte de CV suivant et retourne un JSON valide correspondant exactement à cette structure TypeScript :

{
  "personal": { "firstName": string, "lastName": string, "title": string, "email": string, "phone": string, "city": string, "linkedin": string },
  "summary": string,
  "experiences": Array<{ "title": string, "company": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "description": string[] }>,
  "education": Array<{ "degree": string, "institution": string, "location": string, "startDate": string, "endDate": string }>,
  "skills": Array<{ "name": string, "level": "beginner"|"intermediate"|"expert", "category": "technique"|"soft" }>,
  "languages": Array<{ "language": string, "level": "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"native" }>
}

Règles :
- Utilise des chaînes vides "" pour les champs manquants (pas null)
- Les tableaux vides [] si aucune donnée
- "current": true seulement si le poste est en cours
- Réponds UNIQUEMENT avec le JSON, sans explication ni markdown

Texte du CV :
${text.slice(0, 8000)}`;

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Demo / test users — extract text only, skip OpenAI + Prisma
  const isDemo = DEMO_IDS.has(userId);

  const plan = await getUserPlan(userId);
  const quota = await checkQuota(userId, plan, 'cv_generation');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Quota atteint (${quota.used}/${quota.max} CV générés aujourd'hui). Passez au plan Pro pour plus.` },
      { status: 429 },
    );
  }

  let text: string;
  let name: string;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    name = (form.get('name') as string | null) ?? 'CV importé';

    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

    try {
      text = await extractText(file);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lecture fichier';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else {
    const body = await req.json();
    text = body.text ?? '';
    name = body.name ?? 'CV importé';
  }

  if (!text || text.trim().length < 20) {
    return NextResponse.json({ error: 'Contenu du CV trop court ou illisible' }, { status: 400 });
  }

  // Demo / test users: skip OpenAI + Prisma, return a mock CV immediately
  if (isDemo) {
    return NextResponse.json({
      id: `cv-import-${Date.now()}`,
      userId,
      name: name.slice(0, 100),
      template: 'modern',
      content: {
        personal: { firstName: '', lastName: '', title: '', email: '', phone: '', city: '', linkedin: '' },
        summary: text.slice(0, 300),
        experiences: [],
        education: [],
        skills: [],
        languages: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  }
  let content: Record<string, unknown>;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: CV_PROMPT(text) }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    content = JSON.parse(completion.choices[0].message.content ?? '{}');
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'analyse IA du CV" }, { status: 500 });
  }

  let cv;
  try {
    cv = await prisma.cV.create({
      data: {
        userId,
        name: name.slice(0, 100),
        template: 'modern',
        content: content as object,
      },
    });
  } catch (err: unknown) {
    if (isDbConnectionError(err)) {
      return NextResponse.json({
        id: `cv-import-${Date.now()}`,
        userId,
        name: name.slice(0, 100),
        template: 'modern',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 201 });
    }
    console.error('[POST /api/cv/import] prisma.create', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await incrementUsage(userId, 'cv_generation');

  return NextResponse.json(cv, { status: 201 });
}
