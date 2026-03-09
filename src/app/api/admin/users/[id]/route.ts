import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  let ctx;
  try {
    ctx = await requireAdmin(req, 1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        currentTitle: true,
        location: true,
        plan: true,
        adminLevel: true,
        emailVerified: true,
        onboardingDone: true,
        createdAt: true,
        lastLoginAt: true,
        deletionScheduledAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: { select: { cvs: true, letters: true, applications: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error('[admin/users/:id GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  let ctx;
  try {
    ctx = await requireAdmin(req, 2);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  const body = await req.json();
  // Level 2 can suspend (set deletionScheduledAt), modify plan, reset emailVerified
  // Level 3 can also change adminLevel
  const allowed: Record<string, unknown> = {};

  if ('plan' in body && ['FREE', 'PRO', 'EXPERT'].includes(body.plan)) {
    allowed.plan = body.plan;
  }
  if ('emailVerified' in body && typeof body.emailVerified === 'boolean') {
    allowed.emailVerified = body.emailVerified;
  }
  if ('suspended' in body) {
    // Suspend = schedule deletion 1 year out; unsuspend = clear
    allowed.deletionScheduledAt = body.suspended
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : null;
    if (body.suspended) allowed.deletionReason = 'Suspendu par un administrateur';
    else allowed.deletionReason = null;
  }
  if ('adminLevel' in body && ctx.adminLevel >= 3) {
    // Only L3 can change adminLevel; null removes admin
    const lvl = body.adminLevel === null ? null : parseInt(body.adminLevel);
    if (lvl === null || (lvl >= 1 && lvl <= 3)) {
      allowed.adminLevel = lvl;
    }
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Aucune modification autorisée' }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: allowed,
      select: { id: true, email: true, plan: true, adminLevel: true, emailVerified: true, deletionScheduledAt: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/users/:id PATCH]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req, 3);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    // Hard delete — cascades to cvs, letters, applications etc.
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/users/:id DELETE]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
