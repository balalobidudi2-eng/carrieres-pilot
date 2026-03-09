import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { scoreOfferMatch } from '@/lib/openai-service';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** GET /api/offers/recommended — offers matched to user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Quota check
  const plan = await getUserPlan(userId);
  const quota = userId === DEMO_USER_ID
    ? { allowed: true, used: 0, max: 50, remaining: 50 }
    : await checkQuota(userId, plan, 'ai_matching');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de matchings IA atteinte (${quota.max}/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID) {
    return NextResponse.json({ error: 'France Travail API non configurée' }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentTitle: true, skills: true, targetSectors: true,
      targetContract: true, targetLocations: true, bio: true,
      firstName: true, lastName: true,
    },
  });

  // Build search query from user profile
  const keywords = [user?.currentTitle, ...(user?.skills?.slice(0, 3) ?? [])].filter(Boolean).join(' ');
  const contractMap: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS' };
  const typeContrat = user?.targetContract?.[0] ? contractMap[user.targetContract[0]] : undefined;

  const result = await searchOffers({
    motsCles: keywords || undefined,
    typeContrat,
    range: '0-19',
  });

  let offers = result.resultats.map(normalizeOffer);

  // AI scoring on top-10 if OpenAI is configured
  if (process.env.OPENAI_API_KEY && user) {
    const toScore = offers.slice(0, 10);
    const scored = await Promise.allSettled(
      toScore.map(async (offer) => {
        const match = await scoreOfferMatch(
          { title: user.currentTitle, skills: user.skills, sectors: user.targetSectors, bio: user.bio },
          { title: offer.title, description: offer.description, requirements: offer.requirements },
        );
        return { ...offer, matchScore: match.score as number | undefined };
      }),
    );
    const scoredOffers = scored
      .filter((r): r is PromiseFulfilledResult<typeof toScore[0] & { matchScore: number | undefined }> => r.status === 'fulfilled')
      .map((r) => r.value)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

    // Append the rest (un-scored)
    const scoredIds = new Set(scoredOffers.map((o) => o.id));
    offers = [...scoredOffers, ...offers.filter((o) => !scoredIds.has(o.id))];
  }

  // Increment usage
  if (userId !== DEMO_USER_ID) {
    await incrementUsage(userId, 'ai_matching');
  }

  return NextResponse.json(offers);
}
