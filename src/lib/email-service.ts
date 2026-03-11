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

/** In dev/test, create a temporary Ethereal account and send the email there.
 *  After sending, prints a preview URL to the server console. */
async function sendViaEthereal(mailOptions: nodemailer.SendMailOptions): Promise<void> {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await transporter.sendMail(mailOptions);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  [DEV] Email de vérification envoyé via Ethereal');
  console.log(`  Destinataire : ${mailOptions.to}`);
  console.log(`  Aperçu email : ${nodemailer.getTestMessageUrl(info)}`);
  console.log('  Ouvre ce lien dans ton navigateur pour voir l\'email.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
): Promise<{ success: boolean; error?: string }> {
  const mailOptions: nodemailer.SendMailOptions = {
    from: (process.env.SMTP_FROM || `"CarrièrePilot" <noreply@carrieres-pilot.fr>`).trim(),
    to,
    subject: 'Confirmez votre adresse email — CarrièrePilot',
    html: `
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
    `,
  };

  // In production, SMTP must be configured — never swallow emails via Ethereal
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      const msg =
        'SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS manquants). ' +
        'Email de vérification non envoyé. ' +
        'Configurez ces variables dans votre dashboard Vercel.';
      console.error('[sendVerificationEmail] ⚠️  ' + msg);
      console.error('[sendVerificationEmail] Lien non envoyé pour', to, ':', verifyUrl);
      return { success: false, error: msg };
    }
    // Development only: use Ethereal test inbox (preview URL printed in console)
    try {
      await sendViaEthereal(mailOptions);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur Ethereal';
      console.error('[sendVerificationEmail/ethereal]', message);
      console.log(`\n  [FALLBACK] Lien de vérification : ${verifyUrl}\n`);
      return { success: false, error: message };
    }
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[sendVerificationEmail]', message);
    return { success: false, error: message };
  }
}
