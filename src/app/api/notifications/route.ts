import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/notifications — list job notifications for the current user */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === '1';

  const notifications = await prisma.jobNotification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { detectedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(notifications);
}

/** POST /api/notifications — upsert detected job offers as notifications */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const offers = body.slice(0, 10) as {
    id: string; title: string; company: string; location: string; url?: string; matchScore?: number;
  }[];

  const results = await Promise.allSettled(
    offers.map((o) =>
      prisma.jobNotification.upsert({
        where: { userId_offerId: { userId, offerId: o.id } },
        create: {
          userId,
          offerId: o.id,
          title: o.title ?? 'Offre sans titre',
          company: o.company ?? '',
          location: o.location ?? '',
          url: o.url ?? null,
          matchScore: o.matchScore ?? null,
        },
        update: {}, // don't update existing — keep original detectedAt and read status
      }),
    ),
  );

  const created = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ created });
}

/** PATCH /api/notifications — mark all notifications as read */
export async function PATCH(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  await prisma.jobNotification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
