import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/applications/batch — create multiple applications at once */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const { applications } = body;

  if (!Array.isArray(applications) || applications.length === 0) {
    return NextResponse.json({ error: 'applications[] requis (tableau non vide)' }, { status: 400 });
  }

  if (applications.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 candidatures par lot' }, { status: 400 });
  }

  try {
    const created = await prisma.application.createMany({
      data: applications.map((app: { company: string; jobTitle: string; jobOfferId?: string }) => ({
        userId,
        company: app.company,
        jobTitle: app.jobTitle,
        jobOfferId: app.jobOfferId ?? null,
        status: 'TO_SEND' as const,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/applications/batch]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
