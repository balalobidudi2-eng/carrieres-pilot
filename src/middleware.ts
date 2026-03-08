import { NextRequest, NextResponse } from 'next/server';

// Protected routes (all pages inside the (app) route group)
const PROTECTED = ['/dashboard', '/cv', '/lettre', '/offres', '/candidatures', '/entretiens', '/profil', '/abonnement', '/parametres'];
// Redirect when already authenticated
const AUTH_ROUTES = ['/connexion', '/inscription'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for an auth indicator cookie set by server after login
  // (httpOnly — not readable by JS, but we check a non-sensitive "logged" flag)
  // cp_mock is a dev-only fallback when backend is not configured
  const isLoggedIn = req.cookies.has('cp_logged') || req.cookies.has('cp_mock');

  // Protect app routes
  if (PROTECTED.some((r) => pathname === r || pathname.startsWith(r + '/')) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/connexion';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if already logged in on auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/cv/:path*', '/lettre/:path*', '/offres/:path*', '/candidatures/:path*', '/entretiens/:path*', '/profil/:path*', '/abonnement/:path*', '/parametres/:path*', '/connexion', '/inscription'],
};
