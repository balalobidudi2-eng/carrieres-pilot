/**
 * France Travail (ex Pôle Emploi) — Offres d'emploi API v2
 * Docs : https://francetravail.io/data/api/offres-emploi
 *
 * Auth : OAuth2 client_credentials → token valide 1499 s
 */

const FT_AUTH_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
const FT_API_BASE = 'https://api.francetravail.io/partenaire/offresdemploi/v2';

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Fetch wrapper with AbortController timeout (default 12s) to avoid serverless hangs.
 *  Always sets cache: 'no-store' to prevent Next.js from caching auth tokens or API responses. */
async function fetchFT(url: string, options: RequestInit = {}, timeoutMs = 12_000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID!.trim();
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET!.trim();

  const res = await fetchFT(FT_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'api_offresdemploiv2 o2dsoffre',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`France Travail auth error: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min early
  };
  return cachedToken.token;
}

// ─── Types ───────────────────────────────────────────────────────────

export interface FTOffer {
  id: string;
  intitule: string; // title
  description?: string;
  entreprise?: { nom?: string; description?: string; logo?: string };
  lieuTravail?: { libelle?: string; commune?: string; codePostal?: string };
  typeContrat?: string;
  typeContratLibelle?: string;
  salaire?: { libelle?: string; commentaire?: string };
  experienceExige?: string;
  experienceLibelle?: string;
  competences?: Array<{ code?: string; libelle: string; exigence?: string }>;
  qualitesProfessionnelles?: Array<{ libelle: string; description?: string }>;
  dateCreation?: string;
  origineOffre?: { urlOrigine?: string };
  secteurActiviteLibelle?: string;
  alternance?: boolean;
  accessibleTH?: boolean;
}

export interface FTSearchResult {
  resultats: FTOffer[];
  filtresPossibles?: Array<{ filtre: string; agregation: Array<{ valeurPossible: string; nbResultats: number }> }>;
}

// ─── Search ──────────────────────────────────────────────────────────

export interface OfferSearchParams {
  motsCles?: string;
  commune?: string;
  codeROME?: string;
  typeContrat?: string; // CDI, CDD, MIS, SAI, ...
  experience?: string; // 1 = <1an, 2 = 1-3, 3 = >3
  distance?: number;
  range?: string; // "0-14" (15 results), "0-149" max
  sort?: number; // 0 = relevance, 1 = date, 2 = distance
}

export async function searchOffers(params: OfferSearchParams): Promise<FTSearchResult> {
  const token = await getAccessToken();

  const qs = new URLSearchParams();
  if (params.motsCles) qs.set('motsCles', params.motsCles);
  if (params.commune) qs.set('commune', params.commune);
  if (params.codeROME) qs.set('codeROME', params.codeROME);
  if (params.typeContrat) qs.set('typeContrat', params.typeContrat);
  if (params.experience) qs.set('experience', params.experience);
  if (params.distance) qs.set('distance', String(params.distance));
  qs.set('range', params.range ?? '0-49');
  if (params.sort !== undefined) qs.set('sort', String(params.sort));

  const res = await fetchFT(`${FT_API_BASE}/offres/search?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 204) return { resultats: [] };
    // If 401, invalidate cached token and retry once
    if (res.status === 401 && cachedToken) {
      cachedToken = null;
      const newToken = await getAccessToken();
      const retry = await fetchFT(`${FT_API_BASE}/offres/search?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${newToken}`, Accept: 'application/json' },
      });
      if (retry.ok) return retry.json();
      if (retry.status === 204) return { resultats: [] };
    }
    const err = await res.text();
    throw new Error(`France Travail search error: ${res.status} ${err}`);
  }

  return res.json();
}

export async function getOfferById(id: string): Promise<FTOffer> {
  const token = await getAccessToken();
  const res = await fetchFT(`${FT_API_BASE}/offres/${id}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`France Travail offer error: ${res.status}`);
  return res.json();
}

// ─── Normalize to our frontend type ──────────────────────────────────

export function normalizeOffer(ft: FTOffer) {
  return {
    id: ft.id,
    externalId: ft.id,
    title: ft.intitule,
    company: ft.entreprise?.nom ?? 'Entreprise confidentielle',
    location: ft.lieuTravail?.libelle ?? '',
    contractType: ft.typeContratLibelle ?? ft.typeContrat ?? '',
    salary: ft.salaire?.libelle ?? undefined,
    description: ft.description ?? '',
    requirements: ft.competences?.map((c) => c.libelle) ?? [],
    source: 'france_travail',
    url: ft.origineOffre?.urlOrigine ?? `https://candidat.francetravail.fr/offres/recherche/detail/${ft.id}`,
    publishedAt: ft.dateCreation ?? new Date().toISOString(),
    sector: ft.secteurActiviteLibelle ?? undefined,
    remote: (ft.lieuTravail?.libelle ?? '').toLowerCase().includes('télétravail'),
    matchScore: undefined, // filled later by AI scoring
  };
}
