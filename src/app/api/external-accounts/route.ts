import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

/** GET /api/external-accounts — list configured accounts (never returns passwordHash) */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const accounts = await prisma.externalAccount.findMany({
    where: { userId },
    select: {
      id: true,
      site: true,
      siteLabel: true,
      loginUrl: true,
      email: true,
      isValid: true,
      lastTestedAt: true,
      lastLoginAt: true,
      createdAt: true,
      // passwordHash and cookiesJson are NEVER sent to the frontend
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(accounts);
}

/** POST /api/external-accounts — create or update an external account (upsert by site) */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json() as {
    site?: string;
    siteLabel?: string;
    loginUrl?: string;
    email?: string;
    password?: string;
  };

  const { site, siteLabel, loginUrl, email, password } = body;

  // Sites that use OTP (no password field) — derived from known site list
  const OTP_SITES = new Set(['indeed', 'hellowork']);
  const isOtpSite = OTP_SITES.has(site ?? '');

  if (!site || !email || !loginUrl) {
    return NextResponse.json({ error: 'Champs manquants : site, email et loginUrl sont requis' }, { status: 400 });
  }

  if (!isOtpSite && !password) {
    return NextResponse.json({ error: 'Mot de passe requis pour ce site' }, { status: 400 });
  }

  // Email basic validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  if (!isOtpSite && password && password.length < 6) {
    return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });
  }

  // Encrypt password before storage (OTP sites store empty string)
  const passwordHash = isOtpSite ? '' : encrypt(password!);

  const account = await prisma.externalAccount.upsert({
    where: { userId_site: { userId, site } },
    update: {
      email,
      passwordHash,
      siteLabel: siteLabel ?? site,
      loginUrl,
      isValid: false,        // reset validity on credential change
      cookiesJson: null,     // invalidate cached cookies
      updatedAt: new Date(),
    },
    create: {
      userId,
      site,
      siteLabel: siteLabel ?? site,
      loginUrl,
      email,
      passwordHash,
    },
    select: {
      id: true,
      site: true,
      siteLabel: true,
      loginUrl: true,
      email: true,
      isValid: true,
      lastTestedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
