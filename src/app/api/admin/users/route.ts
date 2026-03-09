import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, 1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const search = searchParams.get('search') ?? '';
  const plan = searchParams.get('plan') ?? '';

  try {
    const where = {
      deletionScheduledAt: null,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(plan && ['FREE', 'PRO', 'EXPERT'].includes(plan) ? { plan: plan as 'FREE' | 'PRO' | 'EXPERT' } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true,
          adminLevel: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          deletionScheduledAt: true,
          _count: { select: { cvs: true, letters: true, applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    console.error('[admin/users]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
