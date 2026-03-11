import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** GET /api/support/contact — fetch user's own support messages */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const messages = await prisma.contactMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, subject: true, message: true, adminReply: true, repliedAt: true, replyRead: true, createdAt: true },
  });

  // Mark unread admin replies as read
  const unreadIds = messages.filter((m) => m.adminReply && !m.replyRead).map((m) => m.id);
  if (unreadIds.length > 0) {
    await prisma.contactMessage.updateMany({ where: { id: { in: unreadIds } }, data: { replyRead: true } });
  }

  return NextResponse.json(messages);
}

/** POST /api/support/contact — user sends a message to admin */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const subject = String(body?.subject ?? '').trim().slice(0, 200);
  const message = String(body?.message ?? '').trim().slice(0, 3000);

  if (!subject || !message) {
    return NextResponse.json({ error: 'Sujet et message requis' }, { status: 400 });
  }

  const contact = await prisma.contactMessage.create({
    data: { userId, subject, message },
  });

  return NextResponse.json({ ok: true, id: contact.id });
}
