import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** GET /api/admin/messages — list contact messages (admin only) */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { adminLevel: true } });
  if (!admin?.adminLevel) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, plan: true } } },
  });

  return NextResponse.json(messages);
}

/** PATCH /api/admin/messages — mark message as read */
export async function PATCH(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { adminLevel: true } });
  if (!admin?.adminLevel) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id } = await req.json();
  await prisma.contactMessage.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
