import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { DEMO_USER, DEMO_USER_ID } from '@/lib/demo-user';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

export async function POST() {
  // Ensure demo user exists in the database so Prisma FK constraints are satisfied
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

  const accessToken = jwt.sign({ sub: DEMO_USER_ID }, JWT_SECRET, { expiresIn: '24h' });

  // Set a special demo refresh token (prefix "demo:" so refresh route can detect it)
  cookies().set('cp_refresh', `demo:${DEMO_USER_ID}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 24 * 60 * 60,
  });

  // Set the logged-in flag cookie (middleware uses this)
  cookies().set('cp_logged', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });

  return NextResponse.json({ accessToken, user: DEMO_USER });
}
