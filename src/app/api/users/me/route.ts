import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, revokeUserTokens, clearAuthCookies } from '@/lib/auth';
import { DEMO_USER, DEMO_USER_ID } from '@/lib/demo-user';

const DEMO_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

// Must mirror TEST_ACCOUNTS from login/route.ts
const TEST_USERS: Record<string, { id: string; email: string; firstName: string; lastName: string; plan: 'FREE' | 'PRO' | 'EXPERT' }> = {
  'test-free': { id: 'test-free', email: 'test-free@carrieres-pilot.fr', firstName: 'Alex', lastName: 'Dupont', plan: 'FREE' },
  'test-pro': { id: 'test-pro', email: 'test-pro@carrieres-pilot.fr', firstName: 'Marie', lastName: 'Bernard', plan: 'PRO' },
  'test-expert': { id: 'test-expert', email: 'test-expert@carrieres-pilot.fr', firstName: 'Julien', lastName: 'Moreau', plan: 'EXPERT' },
};

// Must mirror ADMIN_ACCOUNTS from login/route.ts
const ADMIN_USERS: Record<string, { id: string; email: string; firstName: string; lastName: string; adminLevel: number }> = {
  'admin-l1': { id: 'admin-l1', email: 'admin1@carrieres-pilot.fr', firstName: 'Admin', lastName: 'Niveau 1', adminLevel: 1 },
  'admin-l2': { id: 'admin-l2', email: 'admin2@carrieres-pilot.fr', firstName: 'Admin', lastName: 'Niveau 2', adminLevel: 2 },
  'admin-l3': { id: 'admin-l3', email: 'superadmin@carrieres-pilot.fr', firstName: 'Super', lastName: 'Admin', adminLevel: 3 },
};

/** GET /api/users/me — current user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Return demo user immediately without hitting DB
  if (userId === DEMO_USER_ID) {
    return NextResponse.json(DEMO_USER);
  }

  // Return test account user immediately without hitting DB
  const testUser = TEST_USERS[userId];
  if (testUser) {
    return NextResponse.json({ ...testUser, avatar: null, phone: null, linkedinUrl: null, currentTitle: null, location: null, bio: null, targetSalary: null, targetContract: [], targetSectors: [], targetLocations: [], skills: [], emailVerified: true, onboardingDone: false, createdAt: new Date().toISOString() });
  }

  // Return admin account user immediately without hitting DB
  const adminUser = ADMIN_USERS[userId];
  if (adminUser) {
    return NextResponse.json({ ...adminUser, plan: 'FREE' as const, avatar: null, phone: null, linkedinUrl: null, currentTitle: null, location: null, bio: null, targetSalary: null, targetContract: [], targetSectors: [], targetLocations: [], skills: [], emailVerified: true, onboardingDone: true, createdAt: new Date().toISOString() });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, avatar: true,
        phone: true, linkedinUrl: true, currentTitle: true, location: true,
        bio: true, targetSalary: true, targetContract: true, targetSectors: true,
        targetLocations: true, skills: true, plan: true, emailVerified: true,
        onboardingDone: true, createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: unknown) {
    console.error('[GET /api/users/me]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/users/me — update profile */
export async function PATCH(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  // Whitelist allowed fields
  const allowed = [
    'firstName', 'lastName', 'phone', 'linkedinUrl', 'currentTitle',
    'location', 'bio', 'targetSalary', 'targetContract', 'targetSectors',
    'targetLocations', 'skills', 'onboardingDone', 'avatar',
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (err: unknown) {
    console.error('[PATCH /api/users/me]', err);
    const code = (err as { code?: string })?.code;
    // P1001: DB unreachable in local dev — return submitted data as if saved
    if (code === 'P1001') {
      return NextResponse.json({ id: userId, ...data });
    }
    // P2025: user not found in DB (e.g. registered locally, using prod DB)
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Profil introuvable. Veuillez vous reconnecter ou créer un nouveau compte en production.' }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/users/me — soft-delete account (30-day grace period) */
export async function DELETE(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Demo / test — just log out, no real deletion
  if (DEMO_IDS.has(userId)) {
    clearAuthCookies();
    return NextResponse.json({ ok: true });
  }

  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = body?.reason ?? undefined;
  } catch { /* body may be empty */ }

  const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    await revokeUserTokens(userId);
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionScheduledAt,
        deletionReason: reason ?? null,
      },
    });
    clearAuthCookies();
    return NextResponse.json({ ok: true, deletionScheduledAt });
  } catch (err: unknown) {
    console.error('[DELETE /api/users/me]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
