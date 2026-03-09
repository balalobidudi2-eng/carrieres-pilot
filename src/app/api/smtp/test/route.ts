import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { DEMO_USER_ID } from '@/lib/demo-user';

/** POST /api/smtp/test — sends a test email to the authenticated user */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP non configuré — renseignez SMTP_HOST, SMTP_USER et SMTP_PASS dans votre .env' }, { status: 400 });
  }

  if (userId === DEMO_USER_ID) {
    return NextResponse.json({ error: 'Envoi de test non disponible en mode démo' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  // Verify connection first
  try {
    await transporter.verify();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Connexion SMTP échouée';
    return NextResponse.json({ error: `Connexion SMTP échouée : ${msg}` }, { status: 400 });
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: user.email,
    subject: '✅ Test SMTP — CarrièrePilot',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1E293B;">Connexion SMTP réussie !</h2>
        <p style="color:#64748B;">Bonjour ${user.firstName ?? ''},</p>
        <p style="color:#64748B;">Votre configuration SMTP fonctionne correctement. Vous allez recevoir les alertes emploi et notifications CarrièrePilot sur cette adresse.</p>
        <p style="color:#94A3B8;font-size:12px;margin-top:32px;">Envoyé depuis CarrièrePilot · ${process.env.SMTP_HOST}</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, sentTo: user.email });
}
