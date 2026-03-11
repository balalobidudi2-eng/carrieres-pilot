/**
 * Adzuna Job Search API — France
 * Docs: https://developer.adzuna.com/
 * Env: ADZUNA_APP_ID, ADZUNA_APP_KEY
 */

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs/fr/search/1';

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string };
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
  redirect_url: string;
  category?: { label: string };
}

interface AdzunaResponse {
  results: AdzunaResult[];
  count: number;
}

export async function searchAdzunaOffers({
  keywords,
  contract,
  distance,
}: {
  keywords?: string;
  contract?: string;
  distance?: number;
}): Promise<ReturnType<typeof normalizeAdzunaOffer>[]> {
  const appId = process.env.ADZUNA_APP_ID!;
  const appKey = process.env.ADZUNA_APP_KEY!;

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '20',
    content_type: 'application/json',
  });

  if (keywords) params.set('what', keywords);
  if (distance) params.set('distance', String(distance));
  if (contract) {
    const contractMap: Record<string, string> = {
      CDI: 'permanent', CDD: 'contract', Stage: 'internship', Alternance: 'apprenticeship',
    };
    const mapped = contractMap[contract];
    if (mapped) params.set('contract_type', mapped);
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${ADZUNA_BASE}?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Adzuna error: ${res.status} ${await res.text()}`);
    }

    const data: AdzunaResponse = await res.json();
    return (data.results ?? []).map(normalizeAdzunaOffer);
  } finally {
    clearTimeout(id);
  }
}

function normalizeAdzunaOffer(a: AdzunaResult) {
  let salary: string | undefined;
  if (a.salary_min && a.salary_max) {
    salary = `${Math.round(a.salary_min / 1000)}k – ${Math.round(a.salary_max / 1000)}k€/an`;
  } else if (a.salary_min) {
    salary = `À partir de ${Math.round(a.salary_min / 1000)}k€/an`;
  }

  return {
    id: `adzuna-${a.id}`,
    externalId: a.id,
    title: a.title,
    company: a.company?.display_name ?? 'Entreprise confidentielle',
    location: a.location?.display_name ?? '',
    contractType: a.contract_type ?? '',
    salary,
    description: a.description ?? '',
    requirements: [] as string[],
    source: 'adzuna',
    url: a.redirect_url,
    publishedAt: a.created,
    sector: a.category?.label,
    remote: (a.location?.display_name ?? '').toLowerCase().includes('télétravail') ||
            (a.title ?? '').toLowerCase().includes('remote') ||
            (a.title ?? '').toLowerCase().includes('télétravail'),
    matchScore: undefined as number | undefined,
  };
}
