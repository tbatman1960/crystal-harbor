import type { Address } from './types';
export const SHIPPING_AREA_MESSAGE =
  'We currently ship to U.S. addresses outside Indiana.';
export const INDIANA_SHIPPING_MESSAGE =
  'We do not currently deliver to Indiana addresses. Please use a shipping address outside Indiana.';
type Destination = Pick<Address, 'state' | 'postal_code'>;
/** Indiana ZIPs use the 460–479 prefixes. This also blocks a mismatched state without a network lookup. */
export function isRestrictedShippingAddress(address: Destination) {
  return (
    address.state.trim().toUpperCase() === 'IN' ||
    /^4[67]\d{3}(?:-\d{4})?$/.test(address.postal_code.trim())
  );
}
export class ShippingDestinationError extends Error {
  constructor() {
    super(INDIANA_SHIPPING_MESSAGE);
    this.name = 'ShippingDestinationError';
  }
}
export function assertShippingDestination(address: Destination) {
  if (isRestrictedShippingAddress(address))
    throw new ShippingDestinationError();
}
