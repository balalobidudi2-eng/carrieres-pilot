import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req, 4);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: 'Accès refusé' }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 });
  }

  try {
    const envStatus = {
      openai: !!process.env.OPENAI_API_KEY,
      stripe: !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET),
      smtp: !!(process.env.SMTP_HOST || process.env.SMTP_USER),
      franceTravail: !!(process.env.FRANCE_TRAVAIL_CLIENT_ID || process.env.POLE_EMPLOI_CLIENT_ID),
      jwtSecret: !!process.env.JWT_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
    };

    const [adminCount, totalUsers, dbCheck] = await Promise.all([
      prisma.user.count({ where: { adminLevel: { gt: 0 }, deletionScheduledAt: null } }),
      prisma.user.count({ where: { deletionScheduledAt: null } }),
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    ]);

    return NextResponse.json({
      envStatus,
      adminCount,
      totalUsers,
      dbReachable: dbCheck,
    });
  } catch (err) {
    console.error('[admin/platform-config]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
