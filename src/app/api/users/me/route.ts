import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, revokeUserTokens, clearAuthCookies } from '@/lib/auth';
import { DEMO_USER, DEMO_USER_ID } from '@/lib/demo-user';

/** GET /api/users/me — current user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Return demo user immediately without hitting DB
  if (userId === DEMO_USER_ID) {
    return NextResponse.json(DEMO_USER);
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
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/users/me — delete account */
export async function DELETE(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    await revokeUserTokens(userId);
    await prisma.user.delete({ where: { id: userId } });
    clearAuthCookies();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/users/me]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
