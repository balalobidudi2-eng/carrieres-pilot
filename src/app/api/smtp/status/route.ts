import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/** GET /api/smtp/status — returns whether SMTP is configured */
export async function GET(req: NextRequest) {
  try { requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const configured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  return NextResponse.json({
    configured,
    host: configured ? process.env.SMTP_HOST : null,
    from: configured ? (process.env.SMTP_FROM ?? process.env.SMTP_USER) : null,
  });
}
