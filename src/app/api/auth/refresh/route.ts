import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { rotateRefreshToken, setRefreshCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER, DEMO_USER_ID } from '@/lib/demo-user';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

export async function POST(_req: NextRequest) {
  const cookieStore = cookies();
  const oldToken = cookieStore.get('cp_refresh')?.value;

  if (!oldToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  // Handle demo refresh tokens — no database needed
  if (oldToken.startsWith('demo:')) {
    const demoUserId = oldToken.slice(5);
    // Best-effort DB sync (ignore if no DATABASE_URL)
    try {
      await prisma.user.upsert({
        where: { id: DEMO_USER_ID },
        create: {
          id: DEMO_USER_ID,
          email: DEMO_USER.email,
          passwordHash: 'demo-no-password-hash',
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          currentTitle: DEMO_USER.currentTitle,
          location: DEMO_USER.location,
          bio: DEMO_USER.bio,
          targetSalary: DEMO_USER.targetSalary,
          targetContract: DEMO_USER.targetContract,
          targetSectors: DEMO_USER.targetSectors,
          targetLocations: DEMO_USER.targetLocations,
          skills: DEMO_USER.skills,
          plan: 'PRO',
          emailVerified: true,
          onboardingDone: true,
        },
        update: {},
      });
    } catch {
      // DB unavailable — demo still works without it
    }
    const accessToken = jwt.sign({ sub: demoUserId }, JWT_SECRET, { expiresIn: '24h' });
    return NextResponse.json({ accessToken, user: DEMO_USER });
  }

  const result = await rotateRefreshToken(oldToken);
  if (!result) {
    return NextResponse.json({ error: 'Token expiré ou invalide' }, { status: 401 });
  }

  setRefreshCookie(result.refreshToken);
  return NextResponse.json({ accessToken: result.accessToken });
}
