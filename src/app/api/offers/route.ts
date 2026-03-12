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
  // contract peut être une liste CSV (ex: "CDI,CDD") — on prend le premier contrat valide
  const contractRaw = searchParams.get('contract') ?? undefined;
  const contract = contractRaw?.split(',')[0]?.trim() || undefined;
  const sector = searchParams.get('sector') ?? undefined;
  const distance = searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined;
  const commune = searchParams.get('commune') ?? undefined;
  // Source choisie par l'admin via l'UI (restreinte côté frontend à ghilesaimeur951@gmail.com)
  const source = searchParams.get('source'); // 'adzuna' | 'france_travail' | 'both' | null

  const contractMap: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS', Freelance: 'LIB',
  };

  const keywords = [q, sector].filter(Boolean).join(' ');
  const hasFT = !!process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim();
  const hasAdzuna = !!(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim());

  type NormalizedOffer = Omit<ReturnType<typeof normalizeOffer>, 'matchScore'> & { matchScore?: number };
  let offers: NormalizedOffer[] = [];
  const errors: string[] = [];

  const ftParams = {
    motsCles: keywords || undefined,
    typeContrat: contract ? contractMap[contract] ?? undefined : undefined,
    distance,
    commune,
    range: '0-49' as const,
  };
  const adzunaParams = { keywords, contract, distance };

  if (source === 'both') {
    // Mode admin : agrégation des deux sources en parallèle
    const [ftResult, adzunaResult] = await Promise.allSettled([
      hasFT ? searchOffers(ftParams).then((r) => r.resultats.map(normalizeOffer)) : Promise.resolve([]),
      hasAdzuna ? searchAdzunaOffers(adzunaParams) : Promise.resolve([]),
    ]);
    if (ftResult.status === 'fulfilled') offers.push(...ftResult.value);
    else errors.push(`France Travail: ${ftResult.reason instanceof Error ? ftResult.reason.message : 'Erreur inconnue'}`);
    if (adzunaResult.status === 'fulfilled') offers.push(...adzunaResult.value as NormalizedOffer[]);
    else errors.push(`Adzuna: ${adzunaResult.reason instanceof Error ? adzunaResult.reason.message : 'Erreur inconnue'}`);
  } else if (source === 'adzuna') {
    if (!hasAdzuna) return NextResponse.json({ error: 'Adzuna non configuré' }, { status: 503 });
    try {
      offers = await searchAdzunaOffers(adzunaParams) as NormalizedOffer[];
    } catch (err) {
      return NextResponse.json({ error: `Adzuna: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }, { status: 502 });
    }
  } else if (source === 'france_travail') {
    if (!hasFT) return NextResponse.json({ error: 'France Travail non configuré' }, { status: 503 });
    try {
      const result = await searchOffers(ftParams);
      offers = result.resultats.map(normalizeOffer);
    } catch (err) {
      return NextResponse.json({ error: `France Travail: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }, { status: 502 });
    }
  } else {
    // Comportement par défaut : France Travail d'abord, Adzuna en fallback
    if (hasFT) {
      try {
        const result = await searchOffers(ftParams);
        offers = result.resultats.map(normalizeOffer);
      } catch (err) {
        console.warn('[offers] France Travail failed:', err instanceof Error ? err.message : err);
        errors.push(`France Travail: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    }
    if (offers.length === 0 && hasAdzuna) {
      try {
        offers = await searchAdzunaOffers(adzunaParams) as NormalizedOffer[];
      } catch (err) {
        console.warn('[offers] Adzuna also failed:', err instanceof Error ? err.message : err);
        errors.push(`Adzuna: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    }
    if (offers.length === 0 && !hasFT && !hasAdzuna) {
      return NextResponse.json({ error: 'Aucune source d\'offres configurée' }, { status: 503 });
    }
    if (offers.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: `Échec des sources d'offres : ${errors.join(' | ')}` }, { status: 502 });
    }
  }

  await incrementUsage(userId, 'job_search');

  return NextResponse.json(offers, {
    headers: errors.length > 0 ? { 'X-Source-Warnings': errors.join(' | ') } : {},
  });
}
