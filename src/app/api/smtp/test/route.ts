import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { DEMO_USER_ID } from '@/lib/demo-user';
import { decryptPassword } from '@/lib/smtp';

/** POST /api/smtp/test — sends a test email to the authenticated user */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (userId === DEMO_USER_ID) {
    return NextResponse.json({ error: 'Envoi de test non disponible en mode démo' }, { status: 403 });
  }

  // Resolve SMTP config: user DB config takes precedence over env vars
  let smtpHost: string | undefined;
  let smtpPort: number;
  let smtpUser: string | undefined;
  let smtpPass: string | undefined;
  let smtpFrom: string | undefined;

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpPassEnc: true, smtpFrom: true },
    });
    if (!userRecord) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    if (userRecord.smtpHost && userRecord.smtpUser && userRecord.smtpPassEnc) {
      smtpHost = userRecord.smtpHost;
      smtpPort = userRecord.smtpPort ?? 587;
      smtpUser = userRecord.smtpUser;
      smtpPass = decryptPassword(userRecord.smtpPassEnc);
      smtpFrom = userRecord.smtpFrom ?? userRecord.smtpUser;
    } else {
      smtpHost = process.env.SMTP_HOST;
      smtpPort = Number(process.env.SMTP_PORT ?? 587);
      smtpUser = process.env.SMTP_USER;
      smtpPass = process.env.SMTP_PASS;
      smtpFrom = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP non configuré — renseignez vos paramètres SMTP ci-dessus ou via les variables d\'environnement' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });

    try {
      await transporter.verify();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connexion SMTP échouée';
      return NextResponse.json({ error: `Connexion SMTP échouée : ${msg}` }, { status: 400 });
    }

    await transporter.sendMail({
      from: smtpFrom,
      to: userRecord.email,
      subject: '✅ Test SMTP — CarrièrePilot',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#1E293B;">Connexion SMTP réussie !</h2>
          <p style="color:#64748B;">Bonjour ${userRecord.firstName ?? ''},</p>
          <p style="color:#64748B;">Votre configuration SMTP fonctionne correctement. Vous allez recevoir les alertes emploi et notifications CarrièrePilot sur cette adresse.</p>
          <p style="color:#94A3B8;font-size:12px;margin-top:32px;">Envoyé depuis CarrièrePilot · ${smtpHost}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentTo: userRecord.email });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
