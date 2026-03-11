import { NextRequest, NextResponse } from 'next/server';

// Protected routes (all pages inside the (app) route group)
const PROTECTED = ['/dashboard', '/cv', '/lettre', '/offres', '/candidatures', '/entretiens', '/profil', '/abonnement', '/parametres'];
// Redirect when already authenticated
const AUTH_ROUTES = ['/connexion', '/inscription'];
// Public-only routes that authenticated users shouldn't be redirected away from
const PUBLIC_ONLY_EXCEPTIONS = ['/verifier-email'];
// Admin routes — require cp_admin_level cookie
const ADMIN_PREFIX = '/admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoggedIn = req.cookies.has('cp_logged');
  const adminLevel = req.cookies.get('cp_admin_level')?.value;

  // ── Admin routes ──────────────────────────────────────────────────
  if (pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + '/')) {
    if (!isLoggedIn || !adminLevel) {
      const url = req.nextUrl.clone();
      url.pathname = '/connexion';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Protected app routes ──────────────────────────────────────────
  if (PROTECTED.some((r) => pathname === r || pathname.startsWith(r + '/')) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/connexion';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Redirect to dashboard if already logged in on auth pages ──────
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isLoggedIn && !PUBLIC_ONLY_EXCEPTIONS.some((r) => pathname.startsWith(r))) {
    const url = req.nextUrl.clone();
    url.pathname = adminLevel ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/cv/:path*', '/lettre/:path*', '/offres/:path*', '/candidatures/:path*', '/entretiens/:path*', '/profil/:path*', '/abonnement/:path*', '/parametres/:path*', '/connexion', '/inscription', '/verifier-email'],
};
