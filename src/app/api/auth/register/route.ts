import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, createRefreshToken, setRefreshCookie } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email-service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, password } = body;

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email et mot de passe (8 car. min) requis' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Generate email verification token (valid 24h)
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      emailVerificationToken,
      emailVerificationExpiry,
    },
  });

  // Send verification email (fire-and-forget — don't block login on SMTP failure)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}`;
  sendVerificationEmail(user.email, user.firstName, verifyUrl).then((result) => {
    if (!result.success) {
      console.error('[register] ⚠️  Email de vérification non envoyé à', user.email, ':', result.error);
      console.log('[register] Lien de vérification (backup admin):', verifyUrl);
    }
  }).catch((err) => {
    console.error('[register] sendVerificationEmail exception:', err);
    console.log('[register] Lien de vérification (backup admin):', verifyUrl);
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(refreshToken);

  return NextResponse.json({ accessToken, emailVerified: false }, { status: 201 });
}
