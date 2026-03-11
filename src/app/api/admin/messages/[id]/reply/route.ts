import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req, 1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  const body = await req.json();
  const reply = typeof body?.reply === 'string' ? body.reply.trim() : '';
  if (!reply) return NextResponse.json({ error: 'Réponse requise' }, { status: 400 });

  try {
    const msg = await prisma.contactMessage.update({
      where: { id: params.id },
      data: { adminReply: reply, repliedAt: new Date(), read: true, replyRead: false },
    });
    return NextResponse.json(msg);
  } catch (err) {
    console.error('[admin/messages/:id/reply POST]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
