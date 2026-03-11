import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendApplicationEmail } from '@/lib/email-service';

/** POST /api/applications/send-email — send an application by email */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const { to, fromName, fromEmail, subject, body, cvAttachmentUrl } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Destinataire, sujet et corps requis' }, { status: 400 });
  }

  const result = await sendApplicationEmail({ to, fromName, fromEmail, subject, body, cvAttachmentUrl, userId });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
