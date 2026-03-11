import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/billing/status — current subscription status */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, stripeSubscriptionId: true, stripeCustomerId: true },
    });
    return NextResponse.json({
      plan: user?.plan ?? 'FREE',
      hasSubscription: !!user?.stripeSubscriptionId,
      hasCustomer: !!user?.stripeCustomerId,
    });
  } catch {
    return NextResponse.json({ plan: 'FREE', hasSubscription: false, hasCustomer: false });
  }
}
