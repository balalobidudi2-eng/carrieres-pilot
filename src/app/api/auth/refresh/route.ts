import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { rotateRefreshToken, setRefreshCookie } from '@/lib/auth';
import { setAdminLevelCookie } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { DEMO_USER, DEMO_USER_ID } from '@/lib/demo-user';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

// Must mirror ADMIN_ACCOUNTS from login/route.ts
const ADMIN_USERS: Record<string, { id: string; email: string; firstName: string; lastName: string; adminLevel: number }> = {
  'admin-l1': { id: 'admin-l1', email: 'admin1@carrieres-pilot.fr', firstName: 'Admin', lastName: 'Niveau 1', adminLevel: 1 },
  'admin-l2': { id: 'admin-l2', email: 'admin2@carrieres-pilot.fr', firstName: 'Admin', lastName: 'Niveau 2', adminLevel: 2 },
  'admin-l3': { id: 'admin-l3', email: 'superadmin@carrieres-pilot.fr', firstName: 'Super', lastName: 'Admin', adminLevel: 3 },
};

// Must mirror TEST_ACCOUNTS from login/route.ts
const TEST_USERS: Record<string, { id: string; email: string; firstName: string; lastName: string; plan: 'FREE' | 'PRO' | 'EXPERT' }> = {
  'test-free': { id: 'test-free', email: 'test-free@carrieres-pilot.fr', firstName: 'Alex', lastName: 'Dupont', plan: 'FREE' },
  'test-pro': { id: 'test-pro', email: 'test-pro@carrieres-pilot.fr', firstName: 'Marie', lastName: 'Bernard', plan: 'PRO' },
  'test-expert': { id: 'test-expert', email: 'test-expert@carrieres-pilot.fr', firstName: 'Julien', lastName: 'Moreau', plan: 'EXPERT' },
};

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

  // Handle admin account refresh tokens
  if (oldToken.startsWith('admin:')) {
    const adminUserId = oldToken.slice(6);
    const adminUser = ADMIN_USERS[adminUserId];
    if (!adminUser) {
      return NextResponse.json({ error: 'Compte admin invalide' }, { status: 401 });
    }
    const accessToken = jwt.sign({ sub: adminUserId, adminLevel: adminUser.adminLevel }, JWT_SECRET, { expiresIn: '24h' });
    setAdminLevelCookie(adminUser.adminLevel);
    return NextResponse.json({
      accessToken,
      user: { ...adminUser, plan: 'FREE', emailVerified: true, onboardingDone: true, skills: [], targetContract: [], targetSectors: [], targetLocations: [] },
    });
  }

  // Handle test account refresh tokens — no database needed
  if (oldToken.startsWith('test:')) {
    const testUserId = oldToken.slice(5);
    const testUser = TEST_USERS[testUserId];
    if (!testUser) {
      return NextResponse.json({ error: 'Compte test invalide' }, { status: 401 });
    }
    const accessToken = jwt.sign({ sub: testUserId }, JWT_SECRET, { expiresIn: '24h' });
    return NextResponse.json({ accessToken, user: { ...testUser, emailVerified: true, onboardingDone: true, skills: [], targetContract: [], targetSectors: [], targetLocations: [] } });
  }

  const result = await rotateRefreshToken(oldToken);
  if (!result) {
    return NextResponse.json({ error: 'Token expiré ou invalide' }, { status: 401 });
  }

  setRefreshCookie(result.refreshToken);
  return NextResponse.json({ accessToken: result.accessToken });
}
