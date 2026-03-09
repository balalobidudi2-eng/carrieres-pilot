import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER_ID } from '@/lib/demo-user';

const DEMO_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name   = file.name.toLowerCase();

  if (name.endsWith('.txt')) return buffer.toString('utf-8');

  if (name.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default as (buf: Buffer, options?: { max?: number }) => Promise<{ text: string }>;
      const result   = await pdfParse(buffer, { max: 0 });
      return result.text || '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('XRef') || msg.includes('bad') || msg.includes('Invalid PDF')) {
        return '[PDF importé — extraction partielle non disponible]';
      }
      throw new Error('Ce PDF semble corrompu ou protégé. Essayez de l\'exporter à nouveau ou utilisez le format .txt / .docx');
    }
  }

  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    const mammoth = (await import('mammoth')).default as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
    const result  = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error('Format non supporté. Utilisez .txt, .pdf ou .docx');
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  let jobTitle: string;
  let company: string;
  let content: string;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    jobTitle = decodeURIComponent((form.get('jobTitle') as string | null) ?? '') || 'Poste non précisé';
    company = decodeURIComponent((form.get('company') as string | null) ?? '');

    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

    try {
      content = await extractText(file);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lecture fichier';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else {
    const body = await req.json();
    jobTitle = body.jobTitle ?? 'Poste non précisé';
    company = body.company ?? '';
    content = body.content ?? '';
  }

  if (!content || content.trim().length < 10) {
    return NextResponse.json({ error: 'Contenu de la lettre trop court' }, { status: 400 });
  }

  // Demo / test users — skip DB
  if (DEMO_IDS.has(userId)) {
    const mock = {
      id: `imported-${Date.now()}`,
      userId,
      name: `${jobTitle}${company ? ` — ${company}` : ''}`,
      jobTitle,
      companyName: company,
      content: content.trim(),
      tone: 'professional',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(mock, { status: 201 });
  }

  try {
    const letter = await prisma.coverLetter.create({
      data: {
        userId,
        name: `${jobTitle}${company ? ` — ${company}` : ''}`,
        jobTitle,
        companyName: company,
        content: content.trim(),
        tone: 'professional',
      },
    });
    return NextResponse.json(letter, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes("Can't reach database") || msg.includes('P1001') || msg.includes('localhost')) {
      return NextResponse.json({ error: 'Base de données inaccessible. Réessayez dans quelques instants.' }, { status: 503 });
    }
    console.error('[POST /api/letters/import] prisma.create', err);
    return NextResponse.json({ error: msg || 'Erreur serveur' }, { status: 500 });
  }
}
