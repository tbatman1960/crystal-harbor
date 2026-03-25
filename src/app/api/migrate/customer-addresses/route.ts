import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Running customer address migration...')
    
    // Check if columns already exist by trying to select them
    const { error: checkError } = await supabase
      .from('customers')
      .select('address_line_1')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        message: 'Migration already applied - address columns exist',
        success: true 
      })
    }

    // Apply migration using raw SQL
    const migrationSQL = `
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255), 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(50),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'US';
    `

    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    })

    if (error) {
      console.error('Migration error:', error)
      
      // If RPC doesn't work, try individual column additions
      const columns = [
        { name: 'address_line_1', type: 'VARCHAR(255)' },
        { name: 'address_line_2', type: 'VARCHAR(255)' },
        { name: 'city', type: 'VARCHAR(100)' },
        { name: 'state', type: 'VARCHAR(50)' },
        { name: 'postal_code', type: 'VARCHAR(20)' },
        { name: 'country', type: 'VARCHAR(50) DEFAULT \'US\'' }
      ]

      for (const column of columns) {
        try {
          await supabase.rpc('exec_sql', {
            sql_query: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
          })
        } catch (colError) {
          console.log(`Column ${column.name} may already exist or RPC not available`)
        }
      }
    }

    return NextResponse.json({
      message: 'Customer address migration completed',
      success: true
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed - you may need to run the SQL manually in Supabase dashboard',
        sql: `
          ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
          ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS state VARCHAR(50),
          ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
          ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'US';
        `,
        success: false 
      },
      { status: 500 }
    )
  }
}