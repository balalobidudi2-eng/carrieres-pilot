import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createBillingPortal } from '@/lib/stripe-service';

/** POST /api/billing/portal — create Stripe Billing Portal session */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const origin = req.headers.get('origin') ?? req.nextUrl.origin;
  const url = await createBillingPortal(userId, origin);
  return NextResponse.json({ url });
}
