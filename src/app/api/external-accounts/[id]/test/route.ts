import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { testExternalLogin } from '@/lib/playwright-login';

export const maxDuration = 30;

/** POST /api/external-accounts/[id]/test — test login with Playwright */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Verify ownership — prevents IDOR
  const account = await prisma.externalAccount.findFirst({
    where: { id: params.id, userId },
  });
  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  let password: string;
  try {
    password = decrypt(account.passwordHash);
  } catch {
    return NextResponse.json({ error: 'Impossible de déchiffrer le mot de passe — reconfigurer le compte.' }, { status: 500 });
  }

  const result = await testExternalLogin({
    loginUrl: account.loginUrl,
    email: account.email,
    password,
    site: account.site,
  });

  // Update status and save cookies if login succeeded
  await prisma.externalAccount.update({
    where: { id: account.id },
    data: {
      isValid: result.success,
      lastTestedAt: new Date(),
      lastLoginAt: result.success ? new Date() : account.lastLoginAt,
      cookiesJson: result.cookies ? JSON.stringify(result.cookies) : null,
    },
  });

  return NextResponse.json({
    success: result.success,
    message: result.message,
  });
}
