import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  let user;
  try {
    user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  } catch {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
