import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-carrieres-pilot-fallback';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 7;

// ─── Password hashing ───────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT tokens ──────────────────────────────────────────────────────

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.refreshToken.delete({ where: { id: record.id } });
    return null;
  }
  await prisma.refreshToken.delete({ where: { id: record.id } });
  const accessToken = signAccessToken(record.userId);
  const refreshToken = await createRefreshToken(record.userId);
  return { accessToken, refreshToken };
}

export async function revokeUserTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ─── Request auth helpers ────────────────────────────────────────────

export function verifyAccessToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

/** Extract authenticated userId from a Next.js API route request. Returns null if unauthenticated. */
export function getAuthUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = verifyAccessToken(authHeader.slice(7));
  return payload?.sub ?? null;
}

/** Like getAuthUserId but throws a Response-compatible object for use in route handlers */
export function requireAuth(req: NextRequest): string {
  const userId = getAuthUserId(req);
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
}

// ─── Cookie helpers ──────────────────────────────────────────────────

export function setRefreshCookie(token: string) {
  cookies().set('cp_refresh', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
  });
  cookies().set('cp_logged', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookies() {
  cookies().set('cp_refresh', '', { maxAge: 0, path: '/api/auth/refresh' });
  cookies().set('cp_logged', '', { maxAge: 0, path: '/' });
}
