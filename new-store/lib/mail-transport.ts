import 'server-only';
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { smtpConfig } from './mail-config';
type Message = {
  to: string;
  subject: string;
  text: string;
  replyTo: string;
  defaultFrom: string;
  dedupeKey: string;
};
export async function sendTransactionalEmail(message: Message) {
  if (process.env.SMTP_HOST?.trim()) {
    const transport = nodemailer.createTransport(smtpConfig(process.env));
    const domain = new URL(process.env.SITE_URL!).hostname;
    const result = await transport.sendMail({
      from: process.env.SMTP_FROM || message.defaultFrom,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      messageId: `<snugglebug-${createHash('sha256').update(message.dedupeKey).digest('hex')}@${domain}>`,
    });
    if (!result.accepted?.length || result.rejected?.length)
      throw new Error('SMTP recipient was not accepted.');
    return;
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    throw new Error('Transactional email is not configured.');
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
    },
    { idempotencyKey: message.dedupeKey },
  );
  if (result.error)
    throw new Error('Transactional email provider rejected delivery.');
}
