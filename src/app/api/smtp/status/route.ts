import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/smtp/status — returns whether SMTP is configured (env or user config) */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const envConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smtpHost: true, smtpUser: true, smtpPassEnc: true, smtpFrom: true },
    });
    const userConfigured = !!(user?.smtpHost && user?.smtpUser && user?.smtpPassEnc);
    return NextResponse.json({
      configured: userConfigured || envConfigured,
      host: user?.smtpHost ?? process.env.SMTP_HOST ?? null,
      from: user?.smtpFrom ?? process.env.SMTP_FROM ?? null,
      source: userConfigured ? 'user' : envConfigured ? 'env' : null,
    });
  } catch {
    return NextResponse.json({ configured: envConfigured, host: process.env.SMTP_HOST ?? null, from: process.env.SMTP_FROM ?? null, source: envConfigured ? 'env' : null });
  }
}
