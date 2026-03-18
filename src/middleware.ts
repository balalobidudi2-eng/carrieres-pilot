import { NextRequest, NextResponse } from 'next/server';

// Protected routes (all pages inside the (app) route group)
const PROTECTED = ['/dashboard', '/cv', '/lettre', '/offres', '/candidatures', '/entretiens', '/profil', '/abonnement', '/parametres'];
// Redirect when already authenticated
const AUTH_ROUTES = ['/connexion', '/inscription'];
// Public-only routes that authenticated users shouldn't be redirected away from
const PUBLIC_ONLY_EXCEPTIONS = ['/verifier-email'];
// Admin routes — require cp_admin_level cookie
const ADMIN_PREFIX = '/admin';
// Pre-launch: non-admin users can only access /coming-soon
const COMING_SOON = '/coming-soon';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoggedIn = req.cookies.has('cp_logged');
  const adminLevel = req.cookies.get('cp_admin_level')?.value;
  const siteIsLive = process.env.SITE_IS_LIVE === 'true';

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

  // ── Pre-launch gate: non-admin logged-in users → /coming-soon ────
  if (!siteIsLive && isLoggedIn && !adminLevel) {
    const isProtectedRoute = PROTECTED.some((r) => pathname === r || pathname.startsWith(r + '/'));
    if (isProtectedRoute) {
      const url = req.nextUrl.clone();
      url.pathname = COMING_SOON;
      return NextResponse.redirect(url);
    }
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
    if (adminLevel) {
      url.pathname = '/admin/dashboard';
    } else if (!siteIsLive) {
      url.pathname = COMING_SOON;
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/cv/:path*', '/lettre/:path*', '/offres/:path*', '/candidatures/:path*', '/entretiens/:path*', '/profil/:path*', '/abonnement/:path*', '/parametres/:path*', '/connexion', '/inscription', '/verifier-email'],
};
