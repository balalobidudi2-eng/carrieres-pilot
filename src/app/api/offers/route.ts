import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { scoreOfferMatch } from '@/lib/openai-service';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** GET /api/offers — search real offers from France Travail */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Quota check
  const plan = await getUserPlan(userId);
  const quota = userId === DEMO_USER_ID
    ? { allowed: true, used: 0, max: 100, remaining: 100 }
    : await checkQuota(userId, plan, 'job_search');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de recherches atteinte (${quota.max}/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  const contract = searchParams.get('contract') ?? undefined;
  const sector = searchParams.get('sector') ?? undefined;

  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID) {
    return NextResponse.json({ error: 'France Travail API non configurée' }, { status: 503 });
  }

  const contractMap: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS', Freelance: 'LIB',
  };

  // Build search keywords: combine user query with sector if provided
  const keywords = [q, sector].filter(Boolean).join(' ');

  let result;
  try {
    result = await searchOffers({
      motsCles: keywords || undefined,
      typeContrat: contract ? contractMap[contract] ?? contract : undefined,
      range: '0-49',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur France Travail';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const offers = result.resultats.map(normalizeOffer);

  // Increment usage
  if (userId !== DEMO_USER_ID) {
    await incrementUsage(userId, 'job_search');
  }

  return NextResponse.json(offers);
}
