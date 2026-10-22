import { catalog } from '@/lib/data';
import { db } from '@/lib/supabase';
import { CartPage } from '@/components/cart-page';
export const dynamic = 'force-dynamic';
export default async function Cart() {
  const products = await catalog();
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: p } = user
    ? await client.from('profiles').select('*').eq('id', user.id).single()
    : { data: null };
  return (
    <CartPage
      products={products}
      defaultAddress={p?.default_shipping_address}
      email={user?.email}
    />
  );
}
