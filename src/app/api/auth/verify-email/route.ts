import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/auth/verify-email?token=xxx — confirms a user's email address */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`).trim();

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/connexion?error=token_manquant`);
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: { gt: new Date() },
    },
  }).catch(() => null);

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/connexion?error=lien_expire`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return NextResponse.redirect(`${baseUrl}/connexion?verified=1`);
}

/** POST /api/auth/verify-email/resend — resend verification email */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return ok to avoid user enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const crypto = (await import('crypto')).default;
    const { sendVerificationEmail } = await import('@/lib/email-service');

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken, emailVerificationExpiry },
    });

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`).trim();
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}`;
    const emailResult = await sendVerificationEmail(user.email, user.firstName, verifyUrl);

    // In dev, surface the preview URL so the frontend can show it
    const devPreviewUrl =
      process.env.NODE_ENV !== 'production' ? (emailResult.devPreviewUrl ?? verifyUrl) : undefined;

    return NextResponse.json({ ok: true, devPreviewUrl });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
