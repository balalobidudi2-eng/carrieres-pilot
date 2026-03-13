import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { searchAdzunaOffers } from '@/lib/adzuna';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

/** Interleave two arrays: [a0, b0, a1, b1, ...] */
function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}

/** GET /api/offers — search real offers from France Travail (+ Adzuna fallback) */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifie' }, { status: 401 }); }

  const plan = await getUserPlan(userId).catch(() => 'FREE');
  const quota = await checkQuota(userId, plan, 'job_search').catch(() => ({ allowed: true, used: 0, max: 100, remaining: 100 }));
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de recherches atteinte (${quota.max}/jour). Passez au plan superieur pour continuer.` },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? undefined;
  const contractRaw = searchParams.get('contract') ?? undefined;
  const contract = contractRaw?.split(',')[0]?.trim() || undefined;
  const sector = searchParams.get('sector') ?? undefined;
  const distance = searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined;
  const commune = searchParams.get('commune') ?? undefined;
  const totalRequested = parseInt(searchParams.get('limit') ?? '20', 10);
  const halfLimit = Math.ceil(totalRequested / 2);

  // Source choisie par l'admin via l'UI — les non-admins ne peuvent pas changer la source
  const rawSource = searchParams.get('source');
  let source: string | null = rawSource;
  if (rawSource && rawSource !== 'both') {
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { adminLevel: true } }).catch(() => null);
    if (!userRecord?.adminLevel) {
      source = null; // non-admin: reset to interleaved default
    }
  }

  // LOG PERMANENT
  console.log(`[API /offers] source="${source}" | q="${q ?? ''}" | ts=${new Date().toISOString()}`);

  const contractMap: Record<string, string> = {
    CDI: 'CDI', CDD: 'CDD', Stage: 'SAI', Alternance: 'MIS', Freelance: 'LIB',
  };

  const keywords = [q, sector].filter(Boolean).join(' ');
  const hasFT = !!process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim();
  const hasAdzuna = !!(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim());

  type NormalizedOffer = Omit<ReturnType<typeof normalizeOffer>, 'matchScore'> & { matchScore?: number };
  let offers: NormalizedOffer[] = [];
  const errors: string[] = [];

  const ftRange = `0-${halfLimit - 1}` as `${number}-${number}`;
  const ftParams = {
    motsCles: keywords || undefined,
    typeContrat: contract ? contractMap[contract] ?? undefined : undefined,
    distance,
    commune,
    range: ftRange,
  };
  const adzunaParams = { keywords, contract, distance, location: commune, resultsPerPage: halfLimit };

  if (source === 'both' || source === null) {
    // Regle 50/50 : N/2 de chaque source, entrelaces pour un affichage equilibre
    const [ftResult, adzunaResult] = await Promise.allSettled([
      hasFT ? searchOffers(ftParams).then((r) => r.resultats.map(normalizeOffer)) : Promise.resolve([]),
      hasAdzuna ? searchAdzunaOffers(adzunaParams) : Promise.resolve([]),
    ]);
    const ftOffers = ftResult.status === 'fulfilled' ? ftResult.value : [];
    const azOffers = adzunaResult.status === 'fulfilled' ? (adzunaResult.value as NormalizedOffer[]) : [];
    if (ftResult.status === 'rejected') errors.push(`France Travail: ${ftResult.reason instanceof Error ? ftResult.reason.message : 'Erreur inconnue'}`);
    if (adzunaResult.status === 'rejected') errors.push(`Adzuna: ${adzunaResult.reason instanceof Error ? adzunaResult.reason.message : 'Erreur inconnue'}`);
    // Interleave FT and Adzuna: FT, AZ, FT, AZ...
    offers = interleave(ftOffers.slice(0, halfLimit), azOffers.slice(0, halfLimit)).slice(0, totalRequested);
    console.log(`[API /offers] 50/50 => FT:${ftOffers.length} + AZ:${azOffers.length} = ${offers.length} (interleaved)`);
    if (offers.length === 0 && !hasFT && !hasAdzuna) {
      return NextResponse.json({ error: 'Aucune source d\'offres configuree' }, { status: 503 });
    }
    if (offers.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: 'Echec des sources d\'offres: ' + errors.join(' | ') }, { status: 502 });
    }
  } else if (source === 'adzuna') {
    if (!hasAdzuna) return NextResponse.json({ error: 'Adzuna non configure' }, { status: 503 });
    try {
      offers = await searchAdzunaOffers(adzunaParams) as NormalizedOffer[];
    } catch (err) {
      return NextResponse.json({ error: `Adzuna: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }, { status: 502 });
    }
  } else if (source === 'france_travail') {
    if (!hasFT) return NextResponse.json({ error: 'France Travail non configure' }, { status: 503 });
    try {
      const result = await searchOffers(ftParams);
      offers = result.resultats.map(normalizeOffer);
    } catch (err) {
      return NextResponse.json({ error: `France Travail: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }, { status: 502 });
    }
  }

  // Non-fatal: quota tracking must never crash the route after results are fetched
  await incrementUsage(userId, 'job_search').catch((err) =>
    console.warn('[GET /api/offers] incrementUsage failed (non-fatal):', err instanceof Error ? err.message : err)
  );

  return NextResponse.json(offers, {
    headers: errors.length > 0 ? { 'X-Source-Warnings': errors.join(' | ') } : {},
  });
}