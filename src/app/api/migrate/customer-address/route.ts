import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Adding address fields to customers table...')

    // Check if address fields already exist
    const { error: checkError } = await supabase
      .from('customers')
      .select('address_line_1')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        message: 'Address fields already exist in customers table',
        success: true 
      })
    }

    // Add address fields using raw SQL (if RPC available)
    const addFieldsSQL = `
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(50),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'US';
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: addFieldsSQL 
      })

      if (error) {
        console.error('RPC exec_sql error:', error)
        throw error
      }
    } catch (rpcError) {
      console.log('RPC not available, field addition needs manual setup')
      return NextResponse.json({
        message: 'Address field addition requires manual setup - RPC not available',
        sql: addFieldsSQL,
        success: false
      }, { status: 500 })
    }

    // Verify fields were added
    const { error: verifyError } = await supabase
      .from('customers')
      .select('address_line_1, city, state')
      .limit(1)

    if (verifyError) {
      return NextResponse.json({
        message: 'Field addition may have failed - please run SQL manually',
        sql: addFieldsSQL,
        success: false
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Address fields added to customers table successfully',
      success: true
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({
      error: 'Migration failed - please run SQL manually in Supabase dashboard',
      sql: `
        -- Run this SQL in your Supabase dashboard:
        ALTER TABLE customers 
        ADD COLUMN address_line_1 VARCHAR(255),
        ADD COLUMN address_line_2 VARCHAR(255),
        ADD COLUMN city VARCHAR(100),
        ADD COLUMN state VARCHAR(50),
        ADD COLUMN postal_code VARCHAR(20),
        ADD COLUMN country VARCHAR(50) DEFAULT 'US';
      `,
      success: false
    }, { status: 500 })
  }
}