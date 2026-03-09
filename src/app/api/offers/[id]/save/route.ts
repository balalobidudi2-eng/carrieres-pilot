import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json().catch(() => ({}));
  const { title = '', company = '', location = '', contractType = '', salary, url, description } = body as Record<string, string>;

  try {
    await prisma.savedOffer.upsert({
      where: { userId_offerId: { userId, offerId: params.id } },
      create: { userId, offerId: params.id, title, company, location, contractType, salary: salary ?? null, url: url ?? null, description: description ?? null },
      update: { title, company, location, contractType, salary: salary ?? null, url: url ?? null, description: description ?? null },
    });
    return NextResponse.json({ ok: true, saved: true, offerId: params.id });
  } catch (err: unknown) {
    console.error('[POST /api/offers/[id]/save]', err);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    await prisma.savedOffer.deleteMany({ where: { userId, offerId: params.id } });
    return NextResponse.json({ ok: true, saved: false, offerId: params.id });
  } catch (err: unknown) {
    console.error('[DELETE /api/offers/[id]/save]', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}