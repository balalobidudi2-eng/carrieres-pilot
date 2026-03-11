import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

/** GET /api/offers/recommended — offers matched to user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const plan = await getUserPlan(userId).catch(() => 'FREE');
  const quota = await checkQuota(userId, plan, 'job_search').catch(() => ({ allowed: true, used: 0, max: 100, remaining: 100 }));
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de recherches atteinte (${quota.max}/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID) {
    return NextResponse.json([]);
  }

  // Use explicit search query if provided, otherwise build from user profile
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('q');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentTitle: true, skills: true, targetSectors: true,
      targetContract: true, targetLocations: true,
    },
  });

  // Build search query from explicit param or user profile
  const keywords = searchQuery || [user?.currentTitle, ...(user?.skills?.slice(0, 3) ?? [])].filter(Boolean).join(' ');
  const contractMap: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS' };
  const typeContrat = user?.targetContract?.[0] ? contractMap[user.targetContract[0]] : undefined;

  let result;
  try {
    result = await searchOffers({
      motsCles: keywords || undefined,
      typeContrat,
      range: '0-19',
    });
  } catch (err) {
    console.error('[GET /api/offers/recommended] France Travail error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération des offres recommandées.' }, { status: 503 });
  }

  const offers = result.resultats.map(normalizeOffer);

  // Increment usage
  await incrementUsage(userId, 'job_search');

  return NextResponse.json(offers);
}
