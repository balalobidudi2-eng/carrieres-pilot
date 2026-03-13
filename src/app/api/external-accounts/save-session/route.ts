import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/external-accounts/save-session
 *
 * Saves pre-captured cookies for an OTP account.
 * Used by scripts/capture-session.cjs after the user completes manual login.
 * Works in both dev and production.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json() as {
    site?: string;
    email?: string;
    loginUrl?: string;
    siteLabel?: string;
    cookiesJson?: string;
  };

  const { site, email, loginUrl, siteLabel, cookiesJson } = body;

  if (!site || !email || !loginUrl || !cookiesJson) {
    return NextResponse.json(
      { error: 'site, email, loginUrl et cookiesJson sont requis' },
      { status: 400 }
    );
  }

  // Basic validation: ensure cookiesJson is valid JSON array
  let parsedCookies: unknown;
  try {
    parsedCookies = JSON.parse(cookiesJson);
    if (!Array.isArray(parsedCookies)) throw new Error('Not an array');
  } catch {
    return NextResponse.json({ error: 'cookiesJson invalide — doit être un tableau JSON' }, { status: 400 });
  }

  const resolvedLabel = siteLabel ?? (site.charAt(0).toUpperCase() + site.slice(1));

  await prisma.externalAccount.upsert({
    where: { userId_site: { userId, site } },
    update: {
      email,
      loginUrl,
      cookiesJson,
      isValid: true,
      lastLoginAt: new Date(),
      lastTestedAt: new Date(),
      passwordHash: '',
      updatedAt: new Date(),
    },
    create: {
      userId,
      site,
      siteLabel: resolvedLabel,
      loginUrl,
      email,
      passwordHash: '',
      cookiesJson,
      isValid: true,
      lastLoginAt: new Date(),
    },
  });

  console.log(`[save-session] Session ${site} sauvegardée pour user ${userId} (${(parsedCookies as unknown[]).length} cookies)`);

  return NextResponse.json({
    success: true,
    message: `Session ${resolvedLabel} enregistrée avec succès. CareerPilot utilisera cette session pour postuler.`,
  });
}
