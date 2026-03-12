import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { searchAdzunaOffers } from '@/lib/adzuna';
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
  // P4: use title + skills + sectors + location for better profile-based matching
  const profileTerms = searchQuery ? [searchQuery] : [
    user?.currentTitle,
    ...(user?.skills?.slice(0, 3) ?? []),
    ...(user?.targetSectors?.slice(0, 1) ?? []),
  ].filter(Boolean);
  const keywords = profileTerms.join(' ');
  const contractMap: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS' };
  const typeContrat = user?.targetContract?.[0] ? contractMap[user.targetContract[0]] : undefined;

  type NormalizedOffer = ReturnType<typeof normalizeOffer>;
  let offers: NormalizedOffer[] = [];

  // Essayer France Travail d'abord, Adzuna en fallback si FT échoue
  try {
    const result = await searchOffers({
      motsCles: keywords || undefined,
      typeContrat,
      range: '0-19',
    });
    offers = result.resultats.map(normalizeOffer);
  } catch (ftErr) {
    console.warn('[GET /api/offers/recommended] France Travail failed, trying Adzuna fallback:', ftErr instanceof Error ? ftErr.message : ftErr);
    const hasAdzuna = !!(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim());
    if (hasAdzuna) {
      try {
        const adzunaResults = await searchAdzunaOffers({ keywords: keywords || undefined });
        offers = adzunaResults as NormalizedOffer[];
      } catch (adzErr) {
        console.error('[GET /api/offers/recommended] Adzuna also failed:', adzErr instanceof Error ? adzErr.message : adzErr);
        return NextResponse.json([]);
      }
    } else {
      return NextResponse.json([]);
    }
  }

  // Non-fatal: quota tracking must never crash the route after results are fetched
  await incrementUsage(userId, 'job_search').catch((err) =>
    console.warn('[GET /api/offers/recommended] incrementUsage failed (non-fatal):', err instanceof Error ? err.message : err)
  );

  // Persist top offers as job notifications (upsert — preserves read status and detectedAt)
  // P6: Cap new notifications at 20 per day to avoid overwhelming users
  if (offers.length > 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.jobNotification.count({
      where: { userId, detectedAt: { gte: todayStart } },
    }).catch(() => 0);
    const slotsLeft = Math.max(0, 20 - todayCount);
    if (slotsLeft > 0) {
      prisma.jobNotification.createMany({
        data: offers.slice(0, slotsLeft).map((o) => ({
          userId,
          offerId: o.id,
          title: o.title,
          company: o.company,
          location: o.location ?? '',
          url: o.url ?? null,
          matchScore: o.matchScore ?? null,
        })),
        skipDuplicates: true,
      }).catch(() => {/* fire-and-forget */});
    }
  }

  return NextResponse.json(offers);
}
