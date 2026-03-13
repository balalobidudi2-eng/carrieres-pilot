import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const maxDuration = 120; // 2min — temps maximum pour résoudre un CAPTCHA

/**
 * POST /api/external-accounts/solve-captcha
 * Déclenche la résolution automatique du CAPTCHA Cloudflare Turnstile
 * sur la session Playwright active via le microservice Railway / 2captcha.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }
  void userId; // userId vérifié pour l'auth, non nécessaire dans le proxy

  const body = await req.json() as { sessionId?: string };
  const { sessionId } = body;
  if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });

  const automationUrl = process.env.AUTOMATION_SERVICE_URL;
  const automationSecret = process.env.AUTOMATION_SECRET;

  if (!automationUrl || !automationSecret) {
    return NextResponse.json({ success: false, reason: 'service_not_configured' }, { status: 503 });
  }

  try {
    const res = await fetch(`${automationUrl}/sessions/${sessionId}/solve-captcha`, {
      method: 'POST',
      headers: { 'x-automation-secret': automationSecret },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    return NextResponse.json({ success: false, reason: msg }, { status: 502 });
  }
}
