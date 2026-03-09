import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, createRefreshToken, setRefreshCookie } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

// Hardcoded test accounts (no database required)
const TEST_ACCOUNTS: Record<string, { id: string; email: string; firstName: string; lastName: string; plan: 'FREE' | 'PRO' | 'EXPERT'; password: string }> = {
  'test-free@carrieres-pilot.fr': { id: 'test-free', email: 'test-free@carrieres-pilot.fr', firstName: 'Alex', lastName: 'Dupont', plan: 'FREE', password: 'test2026' },
  'test-pro@carrieres-pilot.fr': { id: 'test-pro', email: 'test-pro@carrieres-pilot.fr', firstName: 'Marie', lastName: 'Bernard', plan: 'PRO', password: 'test2026' },
  'test-expert@carrieres-pilot.fr': { id: 'test-expert', email: 'test-expert@carrieres-pilot.fr', firstName: 'Julien', lastName: 'Moreau', plan: 'EXPERT', password: 'test2026' },
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  }

  // Check hardcoded test accounts first (no DB needed)
  const testAccount = TEST_ACCOUNTS[email.toLowerCase()];
  if (testAccount && password === testAccount.password) {
    const accessToken = jwt.sign({ sub: testAccount.id }, JWT_SECRET, { expiresIn: '24h' });
    const cookieStore = cookies();
    cookieStore.set('cp_refresh', `test:${testAccount.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 24 * 60 * 60,
    });
    cookieStore.set('cp_logged', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
    return NextResponse.json({
      accessToken,
      user: { id: testAccount.id, email: testAccount.email, firstName: testAccount.firstName, lastName: testAccount.lastName, plan: testAccount.plan, emailVerified: true, onboardingDone: true, skills: [], targetContract: [], targetSectors: [], targetLocations: [] },
    });
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

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(refreshToken);

  return NextResponse.json({ accessToken, accountRecovered });
}
