import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, createRefreshToken, setRefreshCookie } from '@/lib/auth';
import { setAdminLevelCookie } from '@/lib/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
  }

  // 1) Validate credentials: prefer Supabase when the user has a supabaseId
  if (user.supabaseId) {
    const { error: sbError } = await supabaseServer.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (sbError) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
  } else {
    // Legacy users (created before Supabase integration): fall back to bcrypt
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }
  }

  // Block login for unverified accounts (admins bypass this check)
  if (!user.emailVerified && !user.adminLevel) {
    return NextResponse.json(
      { error: 'Veuillez vérifier votre adresse email avant de vous connecter.', code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 },
    );
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
      return NextResponse.json({ error: 'Ce compte a été supprimé. Contactez le support si nécessaire.' }, { status: 403 });
    }
  }

  const accessToken = user.adminLevel
    ? jwt.sign({ sub: user.id, adminLevel: user.adminLevel }, JWT_SECRET, { expiresIn: '15m' })
    : signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(refreshToken);

  try {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  } catch { /* ignore */ }

  if (user.adminLevel) {
    setAdminLevelCookie(user.adminLevel);
  }

  return NextResponse.json({ accessToken, accountRecovered });
}
