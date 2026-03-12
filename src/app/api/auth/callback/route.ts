import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/callback
 *
 * Supabase redirects here after a user clicks the email-verification link.
 * Query params differ between Supabase versions:
 *   - PKCE flow (default):  ?code=xxx
 *   - Implicit flow (legacy): ?access_token=xxx&type=signup
 *
 * We exchange the code for a session, then mark the Prisma user as verified.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`).trim();

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/connexion?error=lien_expire`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/connexion?error=token_manquant`);
  }

  // Exchange the one-time code for a Supabase session
  const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error('[callback] exchangeCodeForSession error:', error?.message);
    return NextResponse.redirect(`${baseUrl}/connexion?error=lien_expire`);
  }

  const supabaseId = data.user.id;
  const email = data.user.email?.toLowerCase();

  // Mark the Prisma user as email-verified
  try {
    if (email) {
      await prisma.user.updateMany({
        where: {
          OR: [{ supabaseId }, { email }],
        },
        data: {
          emailVerified: true,
          supabaseId,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
    }
  } catch (err) {
    console.error('[callback] Prisma update error:', err);
  }

  return NextResponse.redirect(`${baseUrl}/connexion?verified=1`);
}
