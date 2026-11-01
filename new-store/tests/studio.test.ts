import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewToken, verifyReviewToken } from '../lib/review-token';
import { siteUrl } from '../lib/site-url';
import { illustrationPrompt } from '../lib/personalization/illustration';
import {
  defaultConfig,
  customizationConfig,
} from '../lib/personalization/designs';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
test('review links are item-bound, signed, expire and reject tampering', () => {
  const id = '11111111-1111-4111-8111-111111111111',
    now = Date.now(),
    t = reviewToken(id, now + 60000, 'secret');
  assert.equal(verifyReviewToken(t, 'secret', now), id);
  assert.equal(verifyReviewToken(t, 'wrong', now), null);
  assert.equal(verifyReviewToken(t, 'secret', now + 60001), null);
  assert.equal(
    verifyReviewToken(t.replace('11111111', '22222222'), 'secret', now),
    null,
  );
  assert.equal(
    verifyReviewToken(
      reviewToken(id, now + 365 * 86400000, 'secret'),
      'secret',
      now,
    ),
    null,
  );
});
test('new preview dispatch and redirects use its Netlify URL instead of old SITE_URL', () => {
  assert.equal(
    siteUrl({
      CONTEXT: 'deploy-preview',
      DEPLOY_PRIME_URL: 'https://deploy-preview-5--store.netlify.app/',
      SITE_URL: 'https://deploy-preview-4--store.netlify.app',
    }),
    'https://deploy-preview-5--store.netlify.app',
  );
  assert.equal(
    siteUrl({
      CONTEXT: 'production',
      DEPLOY_PRIME_URL: 'https://other.example',
      SITE_URL: 'https://store.example',
    }),
    'https://store.example',
  );
});
test('photo mode preserves photographic likeness while legacy illustrations keep their behavior', () => {
  const c = customizationConfig.parse({
    ...defaultConfig,
    template: 'catalog',
    render_style: 'photo',
  });
  assert.match(illustrationPrompt(c), /REAL photographic facial likeness/);
  assert.match(illustrationPrompt(c), /Do not cartoonize/);
  assert.match(
    illustrationPrompt({ ...c, render_style: undefined }),
    /Completely REDRAW/,
  );
  assert.match(illustrationPrompt({ ...c, face_mode: 'all' }), /same person/);
});
test('studio rewards, redemption, totals, and RLS run transactionally on Postgres', async () => {
  const pg = new PGlite();
  await pg.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text not null);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;alter default privileges in schema public grant select,insert,update,delete on tables to anon,authenticated,service_role;alter default privileges in schema public grant usage,select on sequences to anon,authenticated,service_role;`,
  );
  for (const f of readdirSync('supabase/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort())
    await pg.exec(
      readFileSync(`supabase/migrations/${f}`, 'utf8').replace(
        'create extension if not exists pgcrypto;',
        '',
      ),
    );
  const product = '44444444-4444-4444-8444-444444444444',
    draft = '55555555-5555-4555-8555-555555555555',
    draft2 = '66666666-6666-4666-8666-666666666666';
  await pg.query(
    `insert into products(id,name,slug,sku,price_cents,track_inventory,inventory_count,shipping_first_unit_cents) values($1,'Test blanket','test-blanket','TEST',8000,false,0,700)`,
    [product],
  );
  const items = JSON.stringify([
    {
      product_id: product,
      name: 'Test blanket',
      sku: 'TEST',
      unit_price_cents: 8000,
      quantity: 1,
      shipping_first_unit_cents: 700,
      shipping_additional_unit_cents: 0,
    },
  ]);
  const address = JSON.stringify({ state: 'CA' });
  async function reserve(id: string, email = 'one@example.com') {
    await pg.query(
      "select reserve_personalized_checkout($1,null,$2,$3,$3,$4,8000,700,0,'Standard shipping')",
      [id, email, address, items],
    );
  }
  await reserve(draft);
  await pg.query("select attach_studio_coupon($1,'')", [draft]);
  await pg.query(
    "update checkout_drafts set stripe_session_id='cs_first' where id=$1",
    [draft],
  );
  const paid = await pg.query<{ id: string }>(
    "select complete_studio_checkout($1,'cs_first',8700) as id",
    [draft],
  );
  await pg.query("select complete_studio_checkout($1,'cs_first',8700)", [
    draft,
  ]);
  const coupons = await pg.query<{ code: string }>(
    'select code from studio_coupons',
  );
  assert.equal(coupons.rows.length, 1);
  await reserve(draft2);
  await pg.query('select attach_studio_coupon($1,$2)', [
    draft2,
    coupons.rows[0].code,
  ]);
  const totals = await pg.query<{
    total_cents: number;
    discount_cents: number;
  }>('select total_cents,discount_cents from checkout_drafts where id=$1', [
    draft2,
  ]);
  assert.equal(totals.rows[0].discount_cents, 800);
  assert.equal(totals.rows[0].total_cents, 7900);
  const third = '77777777-7777-4777-8777-777777777777';
  await reserve(third);
  await assert.rejects(
    pg.query('select attach_studio_coupon($1,$2)', [
      third,
      coupons.rows[0].code,
    ]),
    /Coupon unavailable/,
  );
  await pg.query(
    "update checkout_drafts set stripe_session_id='cs_second' where id=$1",
    [draft2],
  );
  await pg.query("select complete_studio_checkout($1,'cs_second',7900)", [
    draft2,
  ]);
  await assert.rejects(
    pg.query('select attach_studio_coupon($1,$2)', [
      third,
      coupons.rows[0].code,
    ]),
    /Coupon unavailable/,
  );
  const order = await pg.query<{ discount_cents: number; total_cents: number }>(
    "select discount_cents,total_cents from orders where stripe_session_id='cs_second'",
  );
  assert.equal(order.rows[0].discount_cents, 800);
  assert.equal(order.rows[0].total_cents, 7900);
  const count = await pg.query<{ n: number }>(
    'select count(*)::integer as n from studio_coupons',
  );
  assert.equal(
    count.rows[0].n,
    1,
    'net $72 purchase must not earn a $75-threshold reward',
  );
  await pg.exec('set role anon');
  await assert.rejects(
    pg.query('select * from studio_coupons'),
    /permission denied/,
  );
  await assert.rejects(
    pg.query('select * from studio_reviews'),
    /permission denied/,
  );
  await assert.rejects(
    pg.query(`select attach_studio_coupon('${third}','x')`),
    /permission denied/,
  );
  await pg.exec('reset role');
  assert.ok(paid.rows[0].id);
  await pg.close();
});
