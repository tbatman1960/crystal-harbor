import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Run real Postgres/WASM, mocking only the Supabase-managed schemas and roles.
// These tests never connect to a remote database or touch production data.
test('migration, RLS, and transactional order invariants', async (t) => {
  const pg = new PGlite();
  await pg.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text not null);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;
 alter default privileges in schema public grant select,insert,update,delete on tables to anon,authenticated,service_role;
 alter default privileges in schema public grant usage,select on sequences to anon,authenticated,service_role;
 `);
  for (const file of readdirSync('supabase/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await pg.exec(
      readFileSync(`supabase/migrations/${file}`, 'utf8').replace(
        'create extension if not exists pgcrypto;',
        '',
      ),
    );
  }
  const owner = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const admin = '33333333-3333-4333-8333-333333333333';
  const product = '44444444-4444-4444-8444-444444444444';
  const draft = '55555555-5555-4555-8555-555555555555';
  const address = JSON.stringify({
    name: 'Jane Smith',
    line1: '123 Main',
    city: 'Indianapolis',
    state: 'IN',
    postal_code: '46201',
    country: 'US',
  });
  const items = JSON.stringify([
    {
      product_id: product,
      name: 'Original Stone',
      sku: 'S1',
      unit_price_cents: 1000,
      quantity: 1,
      shipping_first_unit_cents: 799,
      shipping_additional_unit_cents: 100,
    },
  ]);
  await pg.query(
    `insert into auth.users(id,email) values($1,'one@example.com'),($2,'two@example.com'),($3,'admin@example.com')`,
    [owner, other, admin],
  );
  await pg.query('update profiles set is_admin=true where id=$1', [admin]);
  await pg.query(
    `insert into products(id,name,slug,sku,price_cents,weight_lbs,inventory_count,shipping_first_unit_cents,shipping_additional_unit_cents) values($1,'Original Stone','original-stone','S1',1000,.2,1,799,100)`,
    [product],
  );
  async function role(uid: string, fn: () => Promise<void>) {
    await pg.exec('set role authenticated');
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [
      uid,
    ]);
    try {
      await fn();
    } finally {
      await pg.exec('reset role');
    }
  }
  async function reserve(id: string) {
    await pg.query(
      'select reserve_checkout($1,$2,$3,$4,$4,$5,1000,799,80,$6)',
      [id, owner, 'one@example.com', address, items, 'Standard'],
    );
  }
  await t.test('all application tables enforce RLS', async () => {
    const r = await pg.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r'",
    );
    assert.ok(r.rows.length >= 11);
    assert.ok(r.rows.every((r) => r.relrowsecurity));
  });
  await t.test(
    'a customer cannot self-promote or call privileged checkout functions',
    async () => {
      await role(owner, async () => {
        await assert.rejects(
          pg.query('update profiles set is_admin=true where id=$1', [owner]),
          /permission denied/,
        );
        await assert.rejects(reserve(draft), /permission denied/);
        const visible = await pg.query('select * from profiles');
        assert.equal(visible.rows.length, 1);
        const secrets = await pg.query('select * from settings');
        assert.equal(secrets.rows.length, 0);
      });
    },
  );
  await t.test(
    'last unit can be reserved once and cannot be deleted',
    async () => {
      await reserve(draft);
      await assert.rejects(
        reserve('66666666-6666-4666-8666-666666666666'),
        /unavailable/,
      );
      const stock = await pg.query<{ inventory_count: number }>(
        'select inventory_count from products where id=$1',
        [product],
      );
      assert.equal(stock.rows[0].inventory_count, 0);
      await assert.rejects(
        pg.query('delete from products where id=$1', [product]),
        /active checkout/,
      );
    },
  );
  await t.test(
    'amount mismatch rolls back; replay creates only one order/outbox pair',
    async () => {
      await assert.rejects(
        pg.query("select complete_checkout($1,'cs_test_123',1)", [draft]),
        /verification/,
      );
      await pg.query(
        'update products set name=$1,price_cents=2000 where id=$2',
        ['Renamed Stone', product],
      );
      await pg.query("select complete_checkout($1,'cs_test_123',1879)", [
        draft,
      ]);
      await pg.query("select complete_checkout($1,'cs_test_123',1879)", [
        draft,
      ]);
      const o = await pg.query('select * from orders');
      assert.equal(o.rows.length, 1);
      const snapshots = await pg.query<{
        product_name_snapshot: string;
        unit_price_cents: number;
      }>('select * from order_items');
      assert.equal(snapshots.rows[0].product_name_snapshot, 'Original Stone');
      assert.equal(snapshots.rows[0].unit_price_cents, 1000);
      assert.equal((await pg.query('select * from email_jobs')).rows.length, 2);
      await pg.query('select release_checkout($1)', [draft]);
      assert.equal(
        (
          await pg.query<{ inventory_count: number }>(
            'select inventory_count from products',
          )
        ).rows[0].inventory_count,
        0,
      );
    },
  );
  await t.test(
    'order details are owner-only; shipping trigger deduplicates',
    async () => {
      await role(other, async () => {
        assert.equal((await pg.query('select * from orders')).rows.length, 0);
        assert.equal(
          (await pg.query('select * from order_items')).rows.length,
          0,
        );
        await assert.rejects(
          pg.query('select * from checkout_drafts'),
          /permission denied/,
        );
      });
      await role(owner, async () => {
        assert.equal((await pg.query('select * from orders')).rows.length, 1);
        assert.equal(
          (await pg.query('select * from order_items')).rows.length,
          1,
        );
        await assert.rejects(
          pg.query('select * from email_jobs'),
          /permission denied/,
        );
      });
      await role(admin, async () => {
        await pg.exec(
          "update orders set status='shipped',tracking_number='9400123456789012345678'",
        );
        await pg.exec(
          "update orders set status='shipped',tracking_number='9400123456789012345678'",
        );
      });
      assert.equal(
        (await pg.query("select * from email_jobs where kind='shipping'")).rows
          .length,
        1,
      );
    },
  );
  await t.test('expired reservations return stock exactly once', async () => {
    await pg.query(
      'update products set price_cents=1000,inventory_count=2 where id=$1',
      [product],
    );
    const id = '77777777-7777-4777-8777-777777777777';
    await reserve(id);
    await pg.query('select release_checkout($1)', [id]);
    await pg.query('select release_checkout($1)', [id]);
    assert.equal(
      (
        await pg.query<{ inventory_count: number }>(
          'select inventory_count from products',
        )
      ).rows[0].inventory_count,
      2,
    );
  });
  await t.test(
    'category cycles and third-level nesting are rejected',
    async () => {
      const a = await pg.query<{ id: string }>(
        "insert into categories(name,slug) values('Parent','parent') returning id",
      );
      const b = await pg.query<{ id: string }>(
        "insert into categories(name,slug,parent_id) values('Child','child',$1) returning id",
        [a.rows[0].id],
      );
      await assert.rejects(
        pg.query(
          "insert into categories(name,slug,parent_id) values('Grandchild','grandchild',$1)",
          [b.rows[0].id],
        ),
        /one level/,
      );
      await assert.rejects(
        pg.query('update categories set parent_id=id where id=$1', [
          a.rows[0].id,
        ]),
        /one level/,
      );
    },
  );
  await t.test(
    'admin product save persists shipping; customers cannot edit rates',
    async () => {
      const value = {
        id: product,
        category_id: null,
        name: 'Original Stone',
        slug: 'original-stone',
        description: '',
        price_cents: 1000,
        sku: 'S1',
        weight_lbs: 0.2,
        inventory_count: 2,
        is_active: true,
        shipping_first_unit_cents: 500,
        shipping_additional_unit_cents: 125,
      };
      await role(admin, async () => {
        await pg.query('select save_product($1,$2)', [
          JSON.stringify(value),
          '[]',
        ]);
      });
      const saved = await pg.query<{
        shipping_first_unit_cents: number;
        shipping_additional_unit_cents: number;
      }>(
        'select shipping_first_unit_cents,shipping_additional_unit_cents from products where id=$1',
        [product],
      );
      assert.deepEqual(saved.rows[0], {
        shipping_first_unit_cents: 500,
        shipping_additional_unit_cents: 125,
      });
      await role(owner, async () => {
        await pg.query(
          'update products set shipping_first_unit_cents=0 where id=$1',
          [product],
        );
      });
      assert.equal(
        (
          await pg.query<{ shipping_first_unit_cents: number }>(
            'select shipping_first_unit_cents from products where id=$1',
            [product],
          )
        ).rows[0].shipping_first_unit_cents,
        500,
      );
      await assert.rejects(
        reserve('88888888-8888-4888-8888-888888888888'),
        /price changed/,
      );
      await assert.rejects(
        pg.query(
          'update products set shipping_additional_unit_cents=-1 where id=$1',
          [product],
        ),
        /check constraint/,
      );
    },
  );
  await pg.close();
});
