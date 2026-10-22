import { z } from 'zod';
const text = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^[^\r\n]+$/);
/** Existing SMTP names are shared with the original storefront. */
export function smtpConfig(env: Record<string, string | undefined>) {
  const port = Number(env.SMTP_PORT || '587');
  const input = z
    .object({
      host: text,
      port: z.number().int().min(1).max(65535),
      user: text,
      pass: z.string().min(1),
      secure: z.enum(['true', 'false']).optional(),
    })
    .safeParse({
      host: env.SMTP_HOST,
      port,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      secure: env.SMTP_SECURE || undefined,
    });
  if (!input.success)
    throw new Error('SMTP configuration is incomplete or invalid.');
  const v = input.data;
  const secure = v.secure === undefined ? port === 465 : v.secure === 'true';
  return {
    host: v.host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: v.user, pass: v.pass },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  };
}
