import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.txt')) return buffer.toString('utf-8');

  if (name.endsWith('.pdf')) {
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
    jobTitle = (form.get('jobTitle') as string | null) ?? 'Poste non précisé';
    company = (form.get('company') as string | null) ?? '';

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
    console.error('[POST /api/letters/import] prisma.create', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
