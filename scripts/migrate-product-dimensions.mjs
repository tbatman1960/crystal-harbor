// Standalone migration script - adds weight/dimension columns to products table
// Run with: node scripts/migrate-product-dimensions.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bdcqyconjwevyzjlubce.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkY3F5Y29uandldnl6amx1YmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwNzgxMywiZXhwIjoyMDg3NTgzODEzfQ.s4I4YJR7EbY8p29CQrAfTmAi2E6QTtmt1MOclJqwqc0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
  console.log('Adding weight/dimension columns to products table...')

  // Add columns via raw SQL using rpc or just try updating - Supabase doesn't have raw SQL via JS client
  // Instead, we'll use the REST API to run SQL
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  })

  // Alternative approach: use the SQL endpoint directly
  const sqlRes = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  })

  // Since we can't run arbitrary SQL via the JS client, let's use the management API
  // Actually, let's just try to update products with the new fields - if columns don't exist, it'll fail
  // Then we know we need to add them via Supabase dashboard

  // First, let's try reading a product to see if columns exist
  const { data: testProduct, error: testError } = await supabase
    .from('products')
    .select('id, name, weight_lbs, length_inches, width_inches, height_inches')
    .limit(1)

  if (testError && testError.message.includes('weight_lbs')) {
    console.log('Columns do not exist yet. Adding via SQL...')
    
    // Use Supabase Management API to run SQL
    // We need the project ref and service role key
    const projectRef = 'bdcqyconjwevyzjlubce'
    
    const sqlQuery = `
      ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS weight_lbs decimal,
        ADD COLUMN IF NOT EXISTS length_inches decimal,
        ADD COLUMN IF NOT EXISTS width_inches decimal,
        ADD COLUMN IF NOT EXISTS height_inches decimal;
    `
    
    // Try using the Supabase SQL endpoint
    const sqlResponse = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sqlQuery })
    })
    
    if (!sqlResponse.ok) {
      console.log('Cannot run SQL directly. Will create columns via migration API route.')
      console.log('Creating migration API route instead...')
      return false
    }
  } else if (testError) {
    console.log('Error checking columns:', testError.message)
    return false
  } else {
    console.log('Columns already exist! Products:', testProduct?.map(p => p.name))
  }
  
  return true
}

async function updateProducts() {
  console.log('\nUpdating product dimensions...')
  
  const productDefaults = [
    { name: 'Custom T-Shirt', weight_lbs: 0.5, length_inches: 10, width_inches: 8, height_inches: 1 },
    { name: 'Custom Fleece Blanket', weight_lbs: 3.0, length_inches: 14, width_inches: 12, height_inches: 4 },
    { name: 'Custom Vinyl Banner', weight_lbs: 1.0, length_inches: 24, width_inches: 4, height_inches: 4 },
    { name: 'Custom Polyester Flag', weight_lbs: 0.5, length_inches: 14, width_inches: 10, height_inches: 1 },
  ]

  for (const product of productDefaults) {
    const { data, error } = await supabase
      .from('products')
      .update({
        weight_lbs: product.weight_lbs,
        length_inches: product.length_inches,
        width_inches: product.width_inches,
        height_inches: product.height_inches,
      })
      .eq('name', product.name)
      .select('id, name')

    if (error) {
      console.error(`Error updating ${product.name}:`, error.message)
    } else {
      console.log(`✅ Updated ${product.name}: ${product.weight_lbs}lb, ${product.length_inches}x${product.width_inches}x${product.height_inches}`)
    }
  }
}

async function main() {
  const columnsExist = await migrate()
  if (columnsExist !== false) {
    await updateProducts()
  }
}

main().catch(console.error)
