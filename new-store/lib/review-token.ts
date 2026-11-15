import { createHmac, timingSafeEqual } from 'node:crypto';
export function reviewToken(itemId: string, expires: number, secret: string) {
  const payload = `${itemId}.${expires}`;
  return `${payload}.${createHmac('sha256', secret).update(`snuggle-review:${payload}`).digest('hex')}`;
}
export function verifyReviewToken(
  token: string,
  secret: string,
  now = Date.now(),
) {
  const m = token.match(/^([a-f0-9-]{36})\.(\d{13})\.([a-f0-9]{64})$/);
  if (!m || !secret || Number(m[2]) < now || Number(m[2]) > now + 91 * 86400000)
    return null;
  const expected = reviewToken(m[1], Number(m[2]), secret);
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    ? m[1]
    : null;
}
