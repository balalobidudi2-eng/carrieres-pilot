import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/google
 * Redirect the browser to Google's OAuth 2.0 consent screen.
 * Requires env vars: GOOGLE_CLIENT_ID, NEXT_PUBLIC_APP_URL
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`;
    return NextResponse.redirect(`${baseUrl}/connexion?error=google_not_configured`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // CSRF protection — opaque random state stored in a short-lived cookie
  const state = crypto.randomBytes(24).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );

  // Store state in a secure, short-lived HttpOnly cookie (10 min)
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 600,
  });

  return response;
}
