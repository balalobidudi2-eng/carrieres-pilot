import Stripe from 'stripe';
import { prisma } from './prisma';

let _stripe: Stripe | null = null;
let _stripeKey: string | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  if (!_stripe || _stripeKey !== key) {
    _stripe = new Stripe(key, { apiVersion: '2024-04-10' as Stripe.LatestApiVersion });
    _stripeKey = key;
  }
  return _stripe;
}

function getPriceId(plan: 'PRO' | 'EXPERT'): string {
  const raw = plan === 'PRO'
    ? process.env.STRIPE_PRO_PRICE_ID
    : process.env.STRIPE_EXPERT_PRICE_ID;
  const id = raw?.trim();
  if (!id) throw new Error(`Prix Stripe manquant pour le plan ${plan}. Configurez STRIPE_${plan}_PRICE_ID.`);
  return id;
}

export async function createCheckoutSession(userId: string, plan: 'PRO' | 'EXPERT', origin: string) {
  const priceId = getPriceId(plan);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/abonnement?success=1`,
    cancel_url: `${origin}/abonnement?cancelled=1`,
    metadata: { userId, plan },
  });

  return session.url!;
}

export async function createBillingPortal(userId: string, origin: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeCustomerId) throw new Error('No Stripe customer');
  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/abonnement`,
  });
  return portal.url;
}

export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as 'PRO' | 'EXPERT' | undefined;
      if (userId && plan) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubscriptionId: (session as { subscription?: string }).subscription as string,
          },
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.status === 'past_due' || sub.status === 'unpaid') {
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'FREE' },
          });
        }
      }
      break;
    }
  }
}
