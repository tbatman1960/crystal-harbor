// Try connecting to Supabase PostgreSQL directly
// Uses the transaction pooler (port 6543)
import { createRequire } from 'module'

const passwords = ['B@tm@n14425589', 'Batm@n14425589']
const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'db.bdcqyconjwevyzjlubce.supabase.co'
]

async function tryConnect(host, port, password) {
  const { default: pg } = await import('pg')
  const client = new pg.Client({
    host,
    port,
    database: 'postgres',
    user: 'postgres.bdcqyconjwevyzjlubce',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  })
  
  try {
    await client.connect()
    console.log(`Connected to ${host}:${port}!`)
    
    // Run all migrations
    const sqls = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal',
      "ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS category_ids jsonb DEFAULT '[]'::jsonb",
      'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS weight_brackets jsonb',
      'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false',
      'ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_name text',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id text',
    ]
    
    for (const sql of sqls) {
      try {
        await client.query(sql)
        console.log('✅', sql.substring(0, 70))
      } catch (err) {
        console.error('❌', sql.substring(0, 70), '-', err.message)
      }
    }
    
    // Update product dimensions
    const products = [
      { name: 'Custom T-Shirt', w: 0.5, l: 10, wi: 8, h: 1 },
      { name: 'Custom Fleece Blanket', w: 3.0, l: 14, wi: 12, h: 4 },
      { name: 'Custom Vinyl Banner', w: 1.0, l: 24, wi: 4, h: 4 },
      { name: 'Custom Polyester Flag', w: 0.5, l: 14, wi: 10, h: 1 },
    ]
    
    for (const p of products) {
      const res = await client.query(
        'UPDATE products SET weight_lbs=$1, length_inches=$2, width_inches=$3, height_inches=$4 WHERE name=$5',
        [p.w, p.l, p.wi, p.h, p.name]
      )
      console.log(`✅ ${p.name}: ${res.rowCount} rows updated`)
    }
    
    // Verify
    const { rows } = await client.query('SELECT name, weight_lbs, length_inches, width_inches, height_inches FROM products')
    console.table(rows)
    
    // Show shipping_methods columns
    const { rows: cols } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='shipping_methods' ORDER BY ordinal_position`)
    console.log('\nshipping_methods columns:')
    console.table(cols)
    
    await client.end()
    return true
  } catch (err) {
    console.log(`Failed ${host}:${port}: ${err.message}`)
    try { await client.end() } catch(e) {}
    return false
  }
}

async function main() {
  // Need pg module
  try {
    await import('pg')
  } catch(e) {
    console.error('pg module not installed. Installing...')
    const { execSync } = await import('child_process')
    execSync('cd /tmp && npm init -y && npm install pg 2>/dev/null', { stdio: 'pipe' })
    process.env.NODE_PATH = '/tmp/node_modules'
    await import('module').then(m => m.default._initPaths?.())
  }
  
  for (const password of passwords) {
    for (const [host, port] of [[hosts[0], 6543], [hosts[1], 5432]]) {
      console.log(`Trying ${host}:${port} with password...`)
      const success = await tryConnect(host, port, password)
      if (success) return
    }
  }
  
  console.log('\nCould not connect. Please run this SQL manually in Supabase Dashboard > SQL Editor:')
  console.log(`
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
}

main().catch(console.error)
