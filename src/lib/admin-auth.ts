import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

export interface AdminAuthContext {
  userId: string;
  adminLevel: number;
}

/**
 * Verify that the caller is an admin with at least `minLevel`.
 * Relies on JWT payload adminLevel (set at login) or DB lookup.
 * Throws 'UNAUTHORIZED' or 'FORBIDDEN' on failure.
 */
export async function requireAdmin(req: NextRequest, minLevel = 1): Promise<AdminAuthContext> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');

  let payload: { sub: string; adminLevel?: number } | null = null;
  try {
    payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub: string; adminLevel?: number };
  } catch {
    throw new Error('UNAUTHORIZED');
  }

  const userId = payload.sub;

  // Admin level embedded in JWT (set at login)
  if (payload.adminLevel !== undefined && payload.adminLevel !== null) {
    if (payload.adminLevel < minLevel) throw new Error('FORBIDDEN');
    return { userId, adminLevel: payload.adminLevel };
  }

  // DB lookup (most authoritative)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { adminLevel: true },
  });

  if (!user?.adminLevel || user.adminLevel < minLevel) throw new Error('FORBIDDEN');
  return { userId, adminLevel: user.adminLevel };
}

/** Set the non-httpOnly admin cookie (readable by middleware for route protection) */
export function setAdminLevelCookie(level: number) {
  cookies().set('cp_admin_level', String(level), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24h for test accounts, 7 days for real
  });
}

/** Clear the admin cookie */
export function clearAdminCookie() {
  cookies().set('cp_admin_level', '', { maxAge: 0, path: '/' });
}
