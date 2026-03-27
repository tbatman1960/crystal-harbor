import pg from 'pg'
const { Client } = pg

// Supabase direct connection string
// Format: postgresql://postgres.[project-ref]:[password]@[host]:5432/postgres
const client = new Client({
  host: 'db.bdcqyconjwevyzjlubce.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.argv[2] || '',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  if (!process.argv[2]) {
    console.error('Usage: node scripts/run-sql.mjs <DB_PASSWORD>')
    console.error('\nAlternatively, run this SQL in the Supabase Dashboard SQL Editor:')
    console.error(`
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal;

ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS category_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS weight_brackets jsonb;
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id text;
    `)
    process.exit(1)
  }

  await client.connect()
  console.log('Connected to Supabase PostgreSQL')

  const queries = [
    // Phase 1: Product dimensions
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal',
    
    // Phase 2: Shipping methods enhancements
    'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS category_ids jsonb DEFAULT \'[]\'::jsonb',
    'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS weight_brackets jsonb',
    'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false',
    'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false',
    
    // Phase 2: Orders shipping method tracking
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_name text',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id text',
  ]

  for (const sql of queries) {
    try {
      await client.query(sql)
      console.log('✅', sql.substring(0, 80))
    } catch (err) {
      console.error('❌', sql.substring(0, 80), '-', err.message)
    }
  }

  // Update product dimensions
  const productDefaults = [
    { name: 'Custom T-Shirt', weight_lbs: 0.5, length_inches: 10, width_inches: 8, height_inches: 1 },
    { name: 'Custom Fleece Blanket', weight_lbs: 3.0, length_inches: 14, width_inches: 12, height_inches: 4 },
    { name: 'Custom Vinyl Banner', weight_lbs: 1.0, length_inches: 24, width_inches: 4, height_inches: 4 },
    { name: 'Custom Polyester Flag', weight_lbs: 0.5, length_inches: 14, width_inches: 10, height_inches: 1 },
  ]

  for (const p of productDefaults) {
    const res = await client.query(
      'UPDATE products SET weight_lbs=$1, length_inches=$2, width_inches=$3, height_inches=$4 WHERE name=$5',
      [p.weight_lbs, p.length_inches, p.width_inches, p.height_inches, p.name]
    )
    console.log(`✅ Updated ${p.name}: ${res.rowCount} rows`)
  }

  // Verify
  const { rows } = await client.query('SELECT name, weight_lbs, length_inches, width_inches, height_inches FROM products')
  console.log('\nCurrent product dimensions:')
  console.table(rows)

  // Check shipping_methods table structure
  const { rows: smCols } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'shipping_methods' ORDER BY ordinal_position
  `)
  console.log('\nshipping_methods columns:')
  console.table(smCols)

  // Check orders table for shipping columns
  const { rows: orderCols } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'orders' ORDER BY ordinal_position
  `)
  console.log('\norders columns:')
  console.table(orderCols)

  await client.end()
}

run().catch(err => { console.error(err); process.exit(1) })
