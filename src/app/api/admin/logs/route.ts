import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, 3);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    // Last 50 registered users as "registration events"
    const recentRegistrations = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, plan: true, createdAt: true, lastLoginAt: true },
    });

    // Last 50 applications
    const recentApplications = await prisma.application.findMany({
      take: 50,
      orderBy: { appliedAt: 'desc' },
      select: { id: true, company: true, jobTitle: true, status: true, appliedAt: true, userId: true },
    });

    return NextResponse.json({
      recentRegistrations,
      recentApplications,
    });
  } catch (err) {
    console.error('[admin/logs]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
