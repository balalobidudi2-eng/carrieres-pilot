import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe-service';

/** POST /api/billing/cancel — cancel subscription at period end */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 404 });
    }

    await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[POST /api/billing/cancel]', err);
    return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
  }
}

/** DELETE /api/billing/cancel — reactivate (undo cancel_at_period_end) */
export async function DELETE(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 404 });
    }

    await getStripe().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/billing/cancel]', err);
    return NextResponse.json({ error: 'Erreur lors de la réactivation' }, { status: 500 });
  }
}
