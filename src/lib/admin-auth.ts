import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';

// Mirrors ADMIN_ACCOUNTS in login/route.ts
const ADMIN_TEST_LEVELS: Record<string, number> = {
  'admin-l1': 1,
  'admin-l2': 2,
  'admin-l3': 3,
};

export interface AdminAuthContext {
  userId: string;
  adminLevel: number;
}

/**
 * Verify that the caller is an admin with at least `minLevel`.
 * Works for both hardcoded test admin accounts and real DB admins.
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

  // Hardcoded admin test accounts — no DB required
  const testLevel = ADMIN_TEST_LEVELS[userId];
  if (testLevel !== undefined) {
    if (testLevel < minLevel) throw new Error('FORBIDDEN');
    return { userId, adminLevel: testLevel };
  }

  // Admin level embedded in JWT (set at login for real admins)
  if (payload.adminLevel !== undefined && payload.adminLevel !== null) {
    if (payload.adminLevel < minLevel) throw new Error('FORBIDDEN');
    return { userId, adminLevel: payload.adminLevel };
  }

  // DB lookup for real admins (most authoritative check)
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
