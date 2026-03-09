import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe-service';

/** POST /api/billing/checkout — create Stripe Checkout session */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const { plan } = await req.json();
  if (plan !== 'PRO' && plan !== 'EXPERT') {
    return NextResponse.json({ error: 'Plan invalide (PRO ou EXPERT)' }, { status: 400 });
  }

  const origin = req.headers.get('origin') ?? req.nextUrl.origin;
  const url = await createCheckoutSession(userId, plan, origin);
  return NextResponse.json({ url });
}
