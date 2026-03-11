import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, createRefreshToken, setRefreshCookie } from '@/lib/auth';
import { setAdminLevelCookie } from '@/lib/admin-auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
  }

  // 30-day account recovery: if deletion was scheduled and hasn't passed, cancel it
  let accountRecovered = false;
  if (user.deletionScheduledAt) {
    if (user.deletionScheduledAt > new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { deletionScheduledAt: null, deletionReason: null },
      });
      accountRecovered = true;
    } else {
      // Grace period expired — reject login
      return NextResponse.json({ error: 'Ce compte a été supprimé. Contactez le support si nécessaire.' }, { status: 403 });
    }
  }

  const accessToken = user.adminLevel
    ? jwt.sign({ sub: user.id, adminLevel: user.adminLevel }, JWT_SECRET, { expiresIn: '15m' })
    : signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(refreshToken);

  // Track last login + set admin cookie for real admin users
  try {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  } catch { /* ignore if DB unavailable */ }

  if (user.adminLevel) {
    setAdminLevelCookie(user.adminLevel);
  }

  return NextResponse.json({ accessToken, accountRecovered });
}
