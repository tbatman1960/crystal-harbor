import 'server-only';
import type { Address } from './types';
/** Check known ZIP/state mismatches; provider outages do not block manual entry. */
export async function checkPostalState(address: Address) {
  let data: { places?: { 'state abbreviation': string }[] };
  try {
    const r = await fetch(
      `https://api.zippopotam.us/us/${address.postal_code.slice(0, 5)}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } },
    );
    if (!r.ok) return;
    data = await r.json();
  } catch {
    return;
  }
  if (
    data.places?.length &&
    !data.places.some((p) => p['state abbreviation'] === address.state)
  )
    throw new Error(
      'Your cart shipping address has a state that does not match its ZIP code. Check the state and ZIP.',
    );
}
