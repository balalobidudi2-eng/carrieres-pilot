import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { searchAdzunaOffers } from '@/lib/adzuna';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

/** GET /api/offers — search real offers from France Travail (+ Adzuna fallback) */
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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  const contract = searchParams.get('contract') ?? undefined;
  const sector = searchParams.get('sector') ?? undefined;
  const distance = searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined;
  const source = searchParams.get('source'); // optional: 'adzuna' | 'france_travail'

  const contractMap: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS', Freelance: 'LIB',
  };

  const keywords = [q, sector].filter(Boolean).join(' ');
  const hasFT = !!process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const hasAdzuna = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

  let offers: ReturnType<typeof normalizeOffer>[] = [];

  // Try France Travail first (unless user explicitly requests Adzuna)
  if (source !== 'adzuna' && hasFT) {
    try {
      const result = await searchOffers({
        motsCles: keywords || undefined,
        typeContrat: contract ? contractMap[contract] ?? contract : undefined,
        distance,
        range: '0-49',
      });
      offers = result.resultats.map(normalizeOffer);
    } catch (err) {
      console.warn('[offers] France Travail failed, trying Adzuna fallback:', err instanceof Error ? err.message : err);
    }
  }

  // Adzuna fallback: when FT returned 0 results, failed, or user requested it
  if (offers.length === 0 && hasAdzuna) {
    try {
      offers = await searchAdzunaOffers({ keywords, contract, distance });
    } catch (err) {
      console.warn('[offers] Adzuna also failed:', err instanceof Error ? err.message : err);
    }
  }

  if (offers.length === 0 && !hasFT && !hasAdzuna) {
    return NextResponse.json({ error: 'Aucune source d\'offres configurée (France Travail / Adzuna)' }, { status: 503 });
  }

  // Increment usage
  await incrementUsage(userId, 'job_search');

  return NextResponse.json(offers);
}
