import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe-service';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** GET /api/billing/invoices — list Stripe invoices for the user */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (userId === DEMO_USER_ID) {
    return NextResponse.json({ invoices: [], isDemo: true });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ invoices: [], stripeNotConfigured: true });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, stripeSubscriptionId: true, plan: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ invoices: [], noCustomer: true });
    }

    const stripe = getStripe();
    const [invoicesRes, subRes] = await Promise.all([
      stripe.invoices.list({ customer: user.stripeCustomerId, limit: 24 }),
      user.stripeSubscriptionId
        ? stripe.subscriptions.retrieve(user.stripeSubscriptionId)
        : Promise.resolve(null),
    ]);

    const invoices = invoicesRes.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      date: inv.created,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      description: inv.lines?.data?.[0]?.description ?? null,
    }));

    const nextRenewal = subRes?.items?.data?.[0]?.current_period_end
      ? new Date(subRes.items.data[0].current_period_end * 1000).toISOString()
      : null;
    const cancelAtPeriodEnd = subRes?.cancel_at_period_end ?? false;

    return NextResponse.json({
      invoices,
      plan: user.plan,
      nextRenewal,
      cancelAtPeriodEnd,
      subscriptionId: user.stripeSubscriptionId,
    });
  } catch (err: unknown) {
    console.error('[GET /api/billing/invoices]', err);
    return NextResponse.json({ invoices: [], error: 'Erreur Stripe' });
  }
}
