import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health — diagnostic rapide : DB, OpenAI, France Travail
 * Accessible sans authentification (utile pour le monitoring).
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (err: unknown) {
    checks.database = { ok: false, detail: err instanceof Error ? err.message : 'Connexion impossible' };
  }

  // 2. OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    checks.openai = { ok: false, detail: 'OPENAI_API_KEY manquante' };
  } else {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        checks.openai = { ok: true };
      } else {
        const body = await res.text().catch(() => '');
        checks.openai = { ok: false, detail: `HTTP ${res.status} — ${body.slice(0, 200)}` };
      }
    } catch (err: unknown) {
      checks.openai = { ok: false, detail: err instanceof Error ? err.message : 'Erreur réseau' };
    }
  }

  // 3. France Travail
  const ftClientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const ftClientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!ftClientId || !ftClientSecret) {
    checks.franceTravail = { ok: false, detail: 'FRANCE_TRAVAIL_CLIENT_ID ou SECRET manquant' };
  } else {
    try {
      const res = await fetch(
        'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: ftClientId,
            client_secret: ftClientSecret,
            scope: 'api_offresdemploiv2 o2dsoffre',
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (res.ok) {
        checks.franceTravail = { ok: true };
      } else {
        const body = await res.text().catch(() => '');
        checks.franceTravail = { ok: false, detail: `HTTP ${res.status} — ${body.slice(0, 200)}` };
      }
    } catch (err: unknown) {
      checks.franceTravail = { ok: false, detail: err instanceof Error ? err.message : 'Erreur réseau' };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ status: allOk ? 'healthy' : 'degraded', checks }, { status: allOk ? 200 : 503 });
}
