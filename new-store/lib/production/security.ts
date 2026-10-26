import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import type { PrintSpec } from './spec';
import { PRINT_PIPELINE_VERSION } from './spec';
export function printSpecHash(spec: PrintSpec) {
  return createHash('sha256')
    .update(JSON.stringify({ version: PRINT_PIPELINE_VERSION, ...spec }))
    .digest('hex');
}
export function printSignature(
  id: string,
  attempt: number,
  expires: number,
  key: string,
) {
  return createHmac('sha256', key)
    .update(`snuggle-print:${id}:${attempt}:${expires}`)
    .digest('hex');
}
export function validPrintSignature(
  id: string,
  attempt: number,
  expires: number,
  signature: string,
  key: string,
  now = Date.now(),
) {
  if (
    !key ||
    !Number.isInteger(attempt) ||
    attempt < 1 ||
    !Number.isSafeInteger(expires) ||
    expires < now ||
    expires > now + 15 * 60000 ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const expected = Buffer.from(printSignature(id, attempt, expires, key)),
    actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
