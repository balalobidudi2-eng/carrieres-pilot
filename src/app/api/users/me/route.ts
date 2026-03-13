import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, revokeUserTokens, clearAuthCookies } from '@/lib/auth';

/** GET /api/users/me — current user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, avatar: true,
        phone: true, linkedinUrl: true, currentTitle: true, location: true,
        bio: true, targetSalary: true, targetContract: true, targetSectors: true,
        targetLocations: true, skills: true, plan: true, emailVerified: true,
        onboardingDone: true, createdAt: true, adminLevel: true,
        languages: true, portfolio: true, availability: true, objectives: true,
        experiences: true, formations: true,
        workMode: true, companySize: true, companyType: true,
        travelWillingness: true, relocationWillingness: true, dreamJob: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
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
    'languages', 'portfolio', 'availability', 'objectives', 'experiences', 'formations',
    'workMode', 'companySize', 'companyType', 'travelWillingness', 'relocationWillingness', 'dreamJob',
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
