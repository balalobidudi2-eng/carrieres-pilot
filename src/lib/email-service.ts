import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decryptPassword } from './smtp';

function createTransporter() {
  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || '').trim(),
    port: Number((process.env.SMTP_PORT || '587').trim()),
    secure: process.env.SMTP_SECURE?.trim() === 'true',
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
  });
}

const isSmtpConfigured = () => !!(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
const isBrevoConfigured = () => !!process.env.BREVO_API_KEY?.trim();
const isResendConfigured = () => !!process.env.RESEND_API_KEY?.trim();

/** Send email via Brevo REST API (no package needed) */
async function sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'CarrièrePilot', email: process.env.BREVO_FROM || 'noreply@carrierepilot.fr' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo error ${response.status}: ${err}`);
  }
}

interface SendApplicationEmailParams {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  cvAttachmentUrl?: string;
  coverLetterText?: string;
  /** When provided, SMTP credentials are loaded from the user's DB record */
  userId?: string;
}

/** Send an application email via SMTP */
export async function sendApplicationEmail({
  to,
  fromName,
  fromEmail,
  subject,
  body,
  cvAttachmentUrl,
  coverLetterText,
  userId,
}: SendApplicationEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const attachments: nodemailer.SendMailOptions['attachments'] = [];
  if (cvAttachmentUrl) {
    attachments.push({ filename: 'CV.pdf', path: cvAttachmentUrl });
  }
  if (coverLetterText?.trim()) {
    attachments.push({
      filename: 'Lettre_de_motivation.txt',
      content: coverLetterText,
      contentType: 'text/plain; charset=utf-8',
    });
  }

  // Try to load SMTP config from the user's DB record first
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPassEnc: true, smtpFrom: true },
      });

      if (user?.smtpHost && user.smtpUser && user.smtpPassEnc) {
        const plainPass = decryptPassword(user.smtpPassEnc);
        const transporter = nodemailer.createTransport({
          host: user.smtpHost,
          port: user.smtpPort ?? 587,
          secure: (user.smtpPort ?? 587) === 465,
          auth: { user: user.smtpUser, pass: plainPass },
        });

        const mailOptions: nodemailer.SendMailOptions = {
          from: `"${fromName}" <${user.smtpFrom || user.smtpUser}>`,
          to,
          subject,
          html: body.replace(/\n/g, '<br>'),
          attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur SMTP (DB)';
      return { success: false, error: message };
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${fromName}" <${process.env.SMTP_FROM || fromEmail}>`,
    to,
    subject,
    html: body.replace(/\n/g, '<br>'),
    attachments,
  };

  // Dev fallback: use Ethereal when SMTP is not configured
  if (!isSmtpConfigured()) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await transporter.sendMail(mailOptions);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  [DEV] Email de candidature envoyé via Ethereal');
      console.log(`  Destinataire : ${to}`);
      console.log(`  Aperçu email : ${nodemailer.getTestMessageUrl(info)}`);
      console.log('  Ouvre ce lien dans ton navigateur pour voir l\'email.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, messageId: info.messageId ?? 'ethereal' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur Ethereal';
      return { success: false, error: message };
    }
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

/** Send an email verification link after registration */
export async function sendVerificationEmail(
  to: string,
  firstName: string | null,
  verifyUrl: string,
): Promise<{ success: boolean; error?: string; devPreviewUrl?: string }> {
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff;">
      <h2 style="color:#1E293B;margin-bottom:8px;">Bienvenue sur CarrièrePilot${firstName ? `, ${firstName}` : ''}&nbsp;!</h2>
      <p style="color:#475569;margin-bottom:24px;">
        Merci de vous être inscrit(e). Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Confirmer mon email
      </a>
      <p style="color:#94A3B8;font-size:13px;margin-top:32px;">
        Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
      <p style="color:#CBD5E1;font-size:12px;">CarrièrePilot · ${verifyUrl.split('/api')[0]}</p>
    </div>
  `;

  // 1. Brevo (preferred — no SMTP needed, just an API key)
  if (isBrevoConfigured()) {
    try {
      await sendViaBrevo(to, 'Confirmez votre adresse email — CarrièrePilot', html);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur Brevo';
      console.error('[sendVerificationEmail/brevo]', message);
      return { success: false, error: message };
    }
  }

  // 2. Resend (alternative API)
  if (isResendConfigured()) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM?.trim() || 'CarrièrePilot <onboarding@resend.dev>';
    try {
      await resend.emails.send({ from, to, subject: 'Confirmez votre adresse email — CarrièrePilot', html });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur Resend';
      console.error('[sendVerificationEmail/resend]', message);
      return { success: false, error: message };
    }
  }

  // 3. SMTP fallback (if manually configured)
  if (isSmtpConfigured()) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: (process.env.SMTP_FROM || '"CarrièrePilot" <noreply@carrieres-pilot.fr>').trim(),
      to,
      subject: 'Confirmez votre adresse email — CarrièrePilot',
      html,
    };
    try {
      const transporter = createTransporter();
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur SMTP';
      console.error('[sendVerificationEmail/smtp]', message);
      return { success: false, error: message };
    }
  }

  // 4. No email service configured
  if (process.env.NODE_ENV === 'production') {
    const msg = 'Aucun service email configuré. Ajoutez RESEND_API_KEY dans les variables d\'environnement Vercel.';
    console.error('[sendVerificationEmail] ⚠️  ' + msg);
    return { success: false, error: msg };
  }

  // Dev mode: return the direct verification link so the UI can display it
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  [DEV] Aucun service email configuré.');
  console.log('  Ajoutez RESEND_API_KEY dans .env.local pour envoyer de vrais emails.');
  console.log(`  Lien de vérification : ${verifyUrl}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return { success: true, devPreviewUrl: verifyUrl };
}
