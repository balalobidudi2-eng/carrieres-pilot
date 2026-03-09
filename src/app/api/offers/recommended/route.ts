import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOffers, normalizeOffer } from '@/lib/france-travail';
import { scoreOfferMatch } from '@/lib/openai-service';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';

const MOCK_OFFERS = [
  { id: 'mock-1', title: 'Product Designer Senior', company: 'Doctolib', location: 'Paris', contractType: 'CDI', salary: '55 000 – 70 000 €', description: 'Rejoignez l\'équipe Design de Doctolib pour créer des expériences médicales innovantes.', requirements: ['Figma', 'UI/UX', '5+ ans expérience'], postedAt: new Date(Date.now() - 2 * 86400000).toISOString(), url: '#', matchScore: 95 },
  { id: 'mock-2', title: 'UX/UI Designer', company: 'BlaBlaCar', location: 'Paris', contractType: 'CDI', salary: '45 000 – 58 000 €', description: 'Participez à la refonte de l\'expérience mobilité partagée pour des millions d\'utilisateurs.', requirements: ['Figma', 'User Research', 'Prototyping'], postedAt: new Date(Date.now() - 4 * 86400000).toISOString(), url: '#', matchScore: 88 },
  { id: 'mock-3', title: 'Head of Design', company: 'Alan', location: 'Remote', contractType: 'CDI', salary: '70 000 – 90 000 €', description: 'Définissez la vision Design de notre produit de santé numérique en forte croissance.', requirements: ['Leadership', 'Product Design', 'Design System'], postedAt: new Date(Date.now() - 7 * 86400000).toISOString(), url: '#', matchScore: 82 },
  { id: 'mock-4', title: 'Product Designer', company: 'Qonto', location: 'Paris', contractType: 'CDI', salary: '48 000 – 62 000 €', description: 'Améliorez l\'expérience bancaire pour les TPE/PME européennes.', requirements: ['Figma', 'Design System', 'B2B SaaS'], postedAt: new Date(Date.now() - 10 * 86400000).toISOString(), url: '#', matchScore: 79 },
  { id: 'mock-5', title: 'UX Researcher', company: 'Ledger', location: 'Paris', contractType: 'CDI', salary: '42 000 – 55 000 €', description: 'Menez des recherches utilisateurs pour le leader mondial des solutions crypto hardware.', requirements: ['User Testing', 'Interviews', 'Personas'], postedAt: new Date(Date.now() - 14 * 86400000).toISOString(), url: '#', matchScore: 74 },
];

/** GET /api/offers/recommended — offers matched to user profile */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Bypass quota for demo + test accounts (no DB on Vercel)
  const BYPASS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);
  const isBypass = BYPASS.has(userId);

  // Quota check — skip Prisma for bypass users
  const plan = isBypass ? 'PRO' : await getUserPlan(userId).catch(() => 'FREE');
  const quota = isBypass
    ? { allowed: true, used: 0, max: 50, remaining: 50 }
    : await checkQuota(userId, plan, 'ai_matching').catch(() => ({ allowed: true, used: 0, max: 50, remaining: 50 }));
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne de matchings IA atteinte (${quota.max}/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  // France Travail API not configured — return mock offers for all bypass users
  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || isBypass) {
    return NextResponse.json(MOCK_OFFERS);
  }

  // Use explicit search query if provided, otherwise build from user profile
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('q');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentTitle: true, skills: true, targetSectors: true,
      targetContract: true, targetLocations: true, bio: true,
      firstName: true, lastName: true,
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
    return NextResponse.json(MOCK_OFFERS);
  }

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
