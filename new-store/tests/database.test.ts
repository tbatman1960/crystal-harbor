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
 create table auth.users(id uuid primary key,email text not null,email_confirmed_at timestamptz default now());
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
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
  await t.test(
    'admin saves optional design groups and independently stocked sizes',
    async () => {
      const fields = {
        name: 'Sample Blanket',
        slug: 'blanket-lap',
        description: 'Preview',
        price_cents: 2499,
        sku: 'SB-LAP',
        weight_lbs: 0.8,
        inventory_count: 5,
        category_id: null,
        is_active: true,
        shipping_first_unit_cents: 599,
        shipping_additional_unit_cents: 150,
        design_slug: 'sample-blanket',
        size_label: '30 × 40 in',
      };
      await role(admin, async () => {
        await pg.query('select save_product($1,$2)', [
          JSON.stringify(fields),
          '[]',
        ]);
        await pg.query('select save_product($1,$2)', [
          JSON.stringify({
            ...fields,
            slug: 'blanket-throw',
            sku: 'SB-THROW',
            size_label: '50 × 60 in',
            price_cents: 3499,
            inventory_count: 8,
          }),
          '[]',
        ]);
      });
      const rows = await pg.query<{
        sku: string;
        size_label: string;
        inventory_count: number;
        price_cents: number;
      }>(
        "select sku,size_label,inventory_count,price_cents from products where design_slug='sample-blanket' order by price_cents",
      );
      assert.equal(rows.rows.length, 2);
      assert.equal(rows.rows[0].size_label, '30 × 40 in');
      assert.equal(rows.rows[0].inventory_count, 5);
      assert.equal(rows.rows[1].inventory_count, 8);
      assert.equal(rows.rows[1].price_cents, 3499);
    },
  );
  await t.test(
    'untracked products reserve and release without changing inventory, even after tracking toggles',
    async () => {
      const pid = '77777777-7777-4777-8777-777777777777';
      const did = '88888888-8888-4888-8888-888888888888';
      await pg.query(
        `insert into products(id,name,slug,sku,price_cents,weight_lbs,inventory_count,is_active,shipping_first_unit_cents,shipping_additional_unit_cents,track_inventory) values($1,'On demand','on-demand','DEMAND',1000,null,0,true,700,100,false)`,
        [pid],
      );
      const snapshots = JSON.stringify([
        {
          product_id: pid,
          name: 'On demand',
          sku: 'DEMAND',
          unit_price_cents: 1000,
          quantity: 2,
          shipping_first_unit_cents: 700,
          shipping_additional_unit_cents: 100,
        },
      ]);
      await pg.query(
        'select reserve_checkout($1,null,$2,$3,$3,$4,2000,800,0,$5)',
        [did, 'guest@example.com', address, snapshots, 'Standard shipping'],
      );
      const draft = await pg.query<{
        items: { inventory_reserved: boolean }[];
      }>('select items from checkout_drafts where id=$1', [did]);
      assert.equal(draft.rows[0].items[0].inventory_reserved, false);
      await pg.query('update products set track_inventory=true where id=$1', [
        pid,
      ]);
      await pg.query('select release_checkout($1)', [did]);
      await pg.query('select release_checkout($1)', [did]);
      assert.equal(
        (
          await pg.query<{ inventory_count: number }>(
            'select inventory_count from products where id=$1',
            [pid],
          )
        ).rows[0].inventory_count,
        0,
      );
      const trackedDraft = '99999999-9999-4999-8999-999999999999';
      await pg.query('update products set inventory_count=2 where id=$1', [
        pid,
      ]);
      await pg.query(
        'select reserve_checkout($1,null,$2,$3,$3,$4,2000,800,0,$5)',
        [
          trackedDraft,
          'guest@example.com',
          address,
          snapshots,
          'Standard shipping',
        ],
      );
      await pg.query('update products set track_inventory=false where id=$1', [
        pid,
      ]);
      await pg.query('select release_checkout($1)', [trackedDraft]);
      assert.equal(
        (
          await pg.query<{ inventory_count: number }>(
            'select inventory_count from products where id=$1',
            [pid],
          )
        ).rows[0].inventory_count,
        2,
      );
    },
  );
  await t.test(
    'personalized artwork snapshots survive payment replay and cannot be deleted during checkout',
    async () => {
      const pid = '77777777-7777-4777-8777-777777777777';
      const did = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const art = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      await pg.query(
        'update products set track_inventory=false,inventory_count=0 where id=$1',
        [pid],
      );
      await pg.query(
        "insert into personalizations(id,user_id,product_id,session_hash,request_hash,config,source_path,artwork_path,approved_at) values($1,$2,$3,repeat('a',64),repeat('b',64),$4,'photo','art',now())",
        [
          art,
          owner,
          pid,
          JSON.stringify({ name: 'Olivia', template: 'disco' }),
        ],
      );
      await role(other, async () => {
        await assert.rejects(
          pg.query('select * from personalizations'),
          /permission denied/,
        );
        await assert.rejects(
          pg.query('select prepare_personalization_delete($1)', [art]),
          /permission denied/,
        );
      });
      const snapshots = JSON.stringify([
        {
          product_id: pid,
          name: 'Custom Olivia',
          sku: 'CUSTOM',
          unit_price_cents: 1000,
          quantity: 1,
          shipping_first_unit_cents: 700,
          shipping_additional_unit_cents: 100,
          personalization_id: art,
          personalization_snapshot: { name: 'Olivia', template: 'disco' },
        },
      ]);
      await pg.query(
        'select reserve_personalized_checkout($1,$2,$3,$4,$4,$5,1000,700,0,$6)',
        [did, owner, 'one@example.com', address, snapshots, 'Standard'],
      );
      assert.equal(
        (
          await pg.query<{ prepare_personalization_delete: boolean }>(
            'select prepare_personalization_delete($1)',
            [art],
          )
        ).rows[0].prepare_personalization_delete,
        false,
      );
      await pg.query(
        "select complete_personalized_checkout($1,'cs_personalized',1700)",
        [did],
      );
      await pg.query(
        "select complete_personalized_checkout($1,'cs_personalized',1700)",
        [did],
      );
      const line = await pg.query<{
        personalization_id: string;
        personalization_snapshot: { name: string };
      }>(
        'select personalization_id,personalization_snapshot from order_items where personalization_id=$1',
        [art],
      );
      assert.equal(line.rows.length, 1);
      assert.equal(line.rows[0].personalization_snapshot.name, 'Olivia');
      assert.equal(
        (
          await pg.query<{ prepare_personalization_delete: boolean }>(
            'select prepare_personalization_delete($1)',
            [art],
          )
        ).rows[0].prepare_personalization_delete,
        false,
      );
      const unused = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
      await pg.query(
        "insert into personalizations(id,product_id,session_hash,request_hash,config,source_path,artwork_path,approved_at) values($1,$2,repeat('a',64),repeat('b',64),'{}','photo','art',now())",
        [unused, pid],
      );
      assert.equal(
        (
          await pg.query<{ prepare_personalization_delete: boolean }>(
            'select prepare_personalization_delete($1)',
            [unused],
          )
        ).rows[0].prepare_personalization_delete,
        true,
      );
      await assert.rejects(
        pg.query(
          'select reserve_personalized_checkout($1,$2,$3,$4,$4,$5,1000,700,0,$6)',
          [
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            owner,
            'one@example.com',
            address,
            snapshots.replace(art, unused),
            'Standard',
          ],
        ),
        /artwork unavailable/,
      );
    },
  );
  await t.test(
    'preview carts stay private and do not overwrite the existing live cart',
    async () => {
      await role(owner, async () => {
        await pg.query(
          "insert into personalization_carts(user_id,items) values($1,'[]')",
          [owner],
        );
      });
      await role(other, async () => {
        assert.equal(
          (await pg.query('select * from personalization_carts')).rows.length,
          0,
        );
        await assert.rejects(
          pg.query(
            "insert into personalization_carts(user_id,items) values($1,'[]')",
            [admin],
          ),
          /row-level security/,
        );
      });
    },
  );
  await t.test(
    'illustration budgets, service-only access, approval and cleanup are atomic',
    async () => {
      const pid = '77777777-7777-4777-8777-777777777777';
      const ids = [
        '01010101-0101-4101-8101-010101010101',
        '02020202-0202-4202-8202-020202020202',
        '03030303-0303-4303-8303-030303030303',
        '04040404-0404-4404-8404-040404040404',
      ];
      const reserve = (id: string) =>
        pg.query('select reserve_illustration($1,$2,$3,$4,$5,$6,$7,3,25)', [
          id,
          owner,
          'a'.repeat(64),
          'b'.repeat(64),
          pid,
          JSON.stringify({ name: 'Illustrated Jane', template: 'disco' }),
          `illustrations/${id}/portrait.jpg`,
        ]);
      await role(other, async () => {
        await assert.rejects(
          pg.query('select * from illustration_jobs'),
          /permission denied/,
        );
        await assert.rejects(
          pg.query('select approve_illustration($1)', [ids[0]]),
          /permission denied/,
        );
      });
      await reserve(ids[0]);
      await reserve(ids[1]);
      await reserve(ids[2]);
      await assert.rejects(reserve(ids[3]), /Illustration limit/);
      await assert.rejects(
        pg.query('select approve_illustration($1)', [ids[0]]),
        /unavailable/,
      );
      const claim = await pg.query(
        "update illustration_jobs set status='processing' where id=$1 and status='queued' returning id",
        [ids[0]],
      );
      assert.equal(claim.rows.length, 1);
      assert.equal(
        (
          await pg.query(
            "update illustration_jobs set status='processing' where id=$1 and status='queued' returning id",
            [ids[0]],
          )
        ).rows.length,
        0,
      );
      await pg.query(
        "update illustration_jobs set status='ready',artwork_path='drawn.svg',width=1024,height=1536 where id=$1",
        [ids[0]],
      );
      await pg.query('select approve_illustration($1)', [ids[0]]);
      await pg.query('select approve_illustration($1)', [ids[0]]);
      const proof = await pg.query<{
        artwork_kind: string;
        generation_id: string;
        config: { name: string };
      }>(
        'select artwork_kind,generation_id,config from personalizations where id=$1',
        [ids[0]],
      );
      assert.equal(proof.rows.length, 1);
      assert.equal(proof.rows[0].artwork_kind, 'ai');
      assert.equal(proof.rows[0].config.name, 'Illustrated Jane');
      await pg.query(
        "update illustration_jobs set created_at=now()-interval '8 days' where id=$1",
        [ids[0]],
      );
      assert.equal(
        (
          await pg.query<{ prepare_illustration_delete: boolean }>(
            'select prepare_illustration_delete($1)',
            [ids[0]],
          )
        ).rows[0].prepare_illustration_delete,
        false,
      );
      await pg.query('select prepare_personalization_delete($1)', [ids[0]]);
      await assert.rejects(
        pg.query('select approve_illustration($1)', [ids[0]]),
        /unavailable/,
      );
      await pg.query('delete from personalizations where id=$1', [ids[0]]);
      assert.equal(
        (
          await pg.query<{ prepare_illustration_delete: boolean }>(
            'select prepare_illustration_delete($1)',
            [ids[0]],
          )
        ).rows[0].prepare_illustration_delete,
        true,
      );
    },
  );
  await t.test(
    'production exports are service-only, idempotent, block source deletion and require admin ownership',
    async () => {
      const pid = '77777777-7777-4777-8777-777777777777',
        art = 'abababab-abab-4bab-8bab-abababababab';
      await pg.query(
        "insert into personalizations(id,product_id,session_hash,request_hash,config,source_path,artwork_path,approved_at) values($1,$2,repeat('c',64),repeat('d',64),'{}','source','art',now())",
        [art, pid],
      );
      await role(other, async () => {
        await assert.rejects(
          pg.query('select * from print_exports'),
          /permission denied/,
        );
        await assert.rejects(
          pg.query("select reserve_print_export($1,'{}',repeat('a',64),$2)", [
            art,
            other,
          ]),
          /permission denied/,
        );
      });
      await assert.rejects(
        pg.query("select reserve_print_export($1,'{}',repeat('a',64),$2)", [
          art,
          other,
        ]),
        /Forbidden/,
      );
      const first = await pg.query<{ id: string }>(
        "select reserve_print_export($1,$2,repeat('a',64),$3) as id",
        [art, JSON.stringify({ size: '60x80', format: 'svg' }), admin],
      );
      const id = first.rows[0].id;
      const again = await pg.query<{ id: string }>(
        "select reserve_print_export($1,$2,repeat('a',64),$3) as id",
        [art, JSON.stringify({ size: '60x80', format: 'svg' }), admin],
      );
      assert.equal(again.rows[0].id, id);
      assert.equal(
        (
          await pg.query<{ prepare_personalization_delete: boolean }>(
            'select prepare_personalization_delete($1)',
            [art],
          )
        ).rows[0].prepare_personalization_delete,
        false,
      );
      await assert.rejects(
        pg.query('select prepare_print_export_delete($1)', [id]),
        /still processing/,
      );
      await pg.query("update print_exports set status='ready' where id=$1", [
        id,
      ]);
      await pg.query('select prepare_print_export_delete($1)', [id]);
      await pg.query('delete from print_exports where id=$1', [id]);
      assert.equal(
        (
          await pg.query<{ prepare_personalization_delete: boolean }>(
            'select prepare_personalization_delete($1)',
            [art],
          )
        ).rows[0].prepare_personalization_delete,
        true,
      );
    },
  );
  await t.test('production design edits are isolated, versioned and permission checked',async()=>{
    const rpc=async(action:string,version:number,actor:string,email:string)=>{
      await pg.exec('set role service_role');
      try{return await pg.query<{result:{version:number}}>('select production_website_design_action($1,$2,$3,$4,$5,$6) as result',[action,version,JSON.stringify({brand_name:'Test draft'}),actor,email,'Test only']);}
      finally{await pg.exec('reset role');}
    };
    await pg.query("insert into website_collaborators(email,active,can_publish) values('two@example.com',true,false)");
    const saved=await rpc('save',0,other,'two@example.com');
    assert.equal(saved.rows[0].result.version,1);
    assert.equal((await pg.query<{version:number}>("select version from website_design where channel='photo-gift-studio'")).rows[0].version,0);
    assert.deepEqual((await pg.query<{published_config:unknown}>("select published_config from website_design where channel='storefront-production'")).rows[0].published_config,{});
    await assert.rejects(rpc('publish',1,other,'two@example.com'),/Publishing requires/);
    await assert.rejects(rpc('save',0,admin,'admin@example.com'),/Design changed/);
    await rpc('publish',1,admin,'admin@example.com');
    assert.deepEqual((await pg.query<{published_config:unknown}>("select published_config from website_design where channel='storefront-production'")).rows[0].published_config,{brand_name:'Test draft'});
    await pg.query("update website_collaborators set active=false where email='two@example.com'");
    await assert.rejects(rpc('save',2,other,'two@example.com'),/Forbidden/);
    await role(other,async()=>{
      await assert.rejects(pg.query('select * from website_design'),/permission denied/);
      await assert.rejects(pg.query('select * from website_collaborators'),/permission denied/);
      await assert.rejects(pg.query("select production_website_design_action('save',2,'{}',$1,'two@example.com','')",[other]),/permission denied/);
    });
    await pg.exec('set role anon');
    try{await assert.rejects(pg.query('select * from website_design'),/permission denied/);}
    finally{await pg.exec('reset role');}
  });
  await t.test('catalog roles manage products and photos without gaining administrator or website rights',async()=>{
    const pid='ac000000-0000-4000-8000-000000000001';
    const product={id:pid,name:'Catalog role fixture',slug:'catalog-role-fixture',description:'Updated by a product manager',price_cents:1300,sku:'CATALOG-ROLE-TEST',weight_lbs:null,inventory_count:0,track_inventory:false,is_active:false,shipping_group:'blankets',shipping_first_unit_cents:700,shipping_additional_unit_cents:100,design_slug:'catalog-role',size_label:'30 × 40 in',category_id:null};
    const save=()=>pg.query('select save_product($1,$2)',[JSON.stringify(product),JSON.stringify(['https://example.com/first.png','https://example.com/second.png'])]);
    await pg.query("update website_collaborators set role='products',active=false,catalog_active=true,can_publish=false where email='two@example.com'");
    await role(other,async()=>{
      await save();
      assert.equal((await pg.query('select name from products where id=$1',[pid])).rows.length,1);
      const images=await pg.query<{is_primary:boolean}>('select is_primary from product_images where product_id=$1 order by sort_order',[pid]);
      assert.deepEqual(images.rows.map(x=>x.is_primary),[true,false]);
      await pg.query("insert into categories(name,slug) values('Role category','role-category')");
      await pg.query("insert into storage.objects(bucket_id) values('products')");
      assert.equal((await pg.query('select * from settings')).rows.length,0);
      assert.equal((await pg.query('select * from orders')).rows.length,0);
      await assert.rejects(pg.query('update profiles set is_admin=true where id=$1',[other]),/permission denied/);
      await assert.rejects(pg.query('select * from website_collaborators'),/permission denied/);
      await assert.rejects(pg.query("insert into storage.objects(bucket_id) values('personalization-private')"),/row-level security/);
    });
    // Old server deployments check active: product-only accounts must fail that predicate too.
    assert.equal((await pg.query<{active:boolean}>("select active from website_collaborators where email='two@example.com'")).rows[0].active,false);
    await assert.rejects(pg.query("select production_website_design_action('save',2,'{}',$1,'two@example.com','')",[other]),/Forbidden/);
    await assert.rejects(pg.query("update website_collaborators set active=true where email='two@example.com'"),/collaborator_role_access/);
    await pg.query("update website_collaborators set role='collaborator',active=true,catalog_active=false where email='two@example.com'");
    await role(other,async()=>{await save()});
    await pg.query("update website_collaborators set active=false where email='two@example.com'");
    await role(other,async()=>{
      await assert.rejects(save(),/Forbidden/);
      assert.equal((await pg.query('select id from products where id=$1',[pid])).rows.length,0);
      await assert.rejects(pg.query("insert into storage.objects(bucket_id) values('products')"),/row-level security/);
    });
    await pg.query("update website_collaborators set active=true where email='two@example.com'");
    await pg.query('update auth.users set email_confirmed_at=null where id=$1',[other]);
    await role(other,async()=>{await assert.rejects(save(),/Forbidden/)});
  });
  await pg.close();
});
