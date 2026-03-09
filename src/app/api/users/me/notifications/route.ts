import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const allowed = ['notifEmailNewOffer', 'notifEmailApplicationStatus', 'notifEmailWeeklyDigest'];
  const data: Record<string, boolean> = {};
  for (const key of allowed) {
    if (key in body && typeof body[key] === 'boolean') data[key] = body[key];
  }

  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}
