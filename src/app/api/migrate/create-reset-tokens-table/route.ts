import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

const CREATE_TABLE_SQL = `
CREATE TABLE public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
`

export async function GET() {
  try {
    // Check if table exists by trying to query it
    const { error } = await supabase
      .from('password_reset_tokens')
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      return NextResponse.json({
        exists: false,
        message: 'Table does not exist. Run the following SQL in Supabase dashboard:',
        sql: CREATE_TABLE_SQL
      })
    }

    return NextResponse.json({
      exists: true,
      message: 'password_reset_tokens table already exists'
    })
  } catch (error) {
    return NextResponse.json({
      exists: false,
      message: 'Could not check table. Run this SQL in Supabase dashboard:',
      sql: CREATE_TABLE_SQL
    })
  }
}
