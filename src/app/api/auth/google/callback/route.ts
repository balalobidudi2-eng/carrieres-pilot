import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken, createRefreshToken, setRefreshCookie } from '@/lib/auth';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  return res.json() as Promise<GoogleUserInfo>;
}

/**
 * GET /api/auth/google/callback
 * Handles the OAuth 2.0 authorization code exchange, creates or retrieves the
 * user record, then issues JWT tokens and redirects to the dashboard.
 */
export async function GET(req: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`).trim();
  const errorRedirect = (code: string) => NextResponse.redirect(`${baseUrl}/connexion?error=${code}`);

  // Verify env vars are present
  if (!process.env.GOOGLE_CLIENT_ID?.trim() || !process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    return errorRedirect('google_not_configured');
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // User denied access
  if (errorParam) return errorRedirect('google_denied');
  if (!code || !state) return errorRedirect('google_invalid_response');

  // CSRF: validate state matches cookie
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return errorRedirect('google_state_mismatch');
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const googleUser = await fetchGoogleUserInfo(tokens.access_token);

    if (!googleUser.email || !googleUser.email_verified) {
      return errorRedirect('google_email_not_verified');
    }

    const email = googleUser.email.toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // New user via Google — generate a random unusable password (can't login with it)
      const dummyHash = await hashPassword(Math.random().toString(36) + Math.random().toString(36));
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: dummyHash,
          firstName: googleUser.given_name ?? null,
          lastName: googleUser.family_name ?? null,
          avatar: googleUser.picture ?? null,
          // Google-verified email — no need for our own verification
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
    } else if (!user.emailVerified) {
      // Existing unverified account — mark as verified via Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null },
      });
    }

    // Issue session tokens
    const accessToken = signAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);

    // Must await cookie setting (server action context)
    setRefreshCookie(refreshToken);

    // Track last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

    // Pass the access token via a short-lived cookie so the client-side can pick it up
    const redirectResponse = NextResponse.redirect(`${baseUrl}/dashboard`);
    redirectResponse.cookies.set('cp_access_token', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60, // 1 minute — client reads it immediately and clears it
    });
    // Clear the state cookie
    redirectResponse.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/api/auth/google' });

    return redirectResponse;
  } catch (err) {
    console.error('[google-callback]', err);
    return errorRedirect('google_error');
  }
}
