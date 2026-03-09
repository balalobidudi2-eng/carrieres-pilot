import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

interface SendApplicationEmailParams {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  cvAttachmentUrl?: string;
}

/** Send an application email via SMTP */
export async function sendApplicationEmail({
  to,
  fromName,
  fromEmail,
  subject,
  body,
  cvAttachmentUrl,
}: SendApplicationEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS manquants)' };
  }

  try {
    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    if (cvAttachmentUrl) {
      attachments.push({
        filename: 'CV.pdf',
        path: cvAttachmentUrl,
      });
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_FROM || fromEmail}>`,
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
      attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}
