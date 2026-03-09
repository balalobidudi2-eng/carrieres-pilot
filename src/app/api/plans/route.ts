import { NextResponse } from 'next/server';
import { PLANS, QUOTA_LABELS } from '@/lib/plans';

/** GET /api/plans — public list of plans for pricing page */
export async function GET() {
  const plans = Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    priceAnnual: p.priceAnnual,
    dailyLimits: p.dailyLimits,
    features: p.features,
  }));

  return NextResponse.json({ plans, labels: QUOTA_LABELS });
}
