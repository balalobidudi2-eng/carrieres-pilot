 import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 15;

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-extension-secret',
    'Access-Control-Allow-Credentials': 'false',
  };
}

// Preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/**
 * POST /api/external-accounts/save-cookies
 * Reçoit les cookies Indeed depuis l'extension Chrome et les transmet
 * au microservice Railway pour injection dans Playwright.
 */
export async function POST(req: NextRequest) {
  const ch = corsHeaders(req);
  // Vérification du secret extension
  const extensionSecret = process.env.EXTENSION_SECRET;
  if (!extensionSecret || req.headers.get('x-extension-secret') !== extensionSecret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401, headers: ch });
  }

  // Vérification auth via cookie cp_refresh
  const { cookies: reqCookies } = await import('next/headers');
  const cookieStore = reqCookies();
  const refreshToken = cookieStore.get('cp_refresh')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: ch });
  }
  const { prisma } = await import('@/lib/prisma');
  const tokenRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Session expirée' }, { status: 401, headers: ch });
  }
  const userId = tokenRecord.userId;

  const body = await req.json() as { cookies?: unknown[] };
  const { cookies } = body;

  if (!Array.isArray(cookies) || cookies.length === 0) {
    return NextResponse.json({ error: 'cookies manquants ou vides' }, { status: 400, headers: ch });
  }

  const automationUrl = process.env.AUTOMATION_SERVICE_URL;
  const automationSecret = process.env.AUTOMATION_SECRET;

  if (!automationUrl || !automationSecret) {
    return NextResponse.json({ error: 'Service d\'automatisation non configuré' }, { status: 503, headers: ch });
  }

  const res = await fetch(`${automationUrl}/store-cookies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-automation-secret': automationSecret,
    },
    body: JSON.stringify({ userId, cookies }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    console.error('[save-cookies] Automation error:', res.status, text);
    return NextResponse.json({ error: 'Erreur transmission vers le service automation' }, { status: 502, headers: ch });
  }

  console.log(`[save-cookies] Cookies Indeed stockés pour userId: ${userId} (${cookies.length} cookies)`);
  return NextResponse.json({ success: true }, { headers: ch });
}
