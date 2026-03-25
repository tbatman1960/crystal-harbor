import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

const CREATE_TABLE_SQL = `
CREATE TABLE public.newsletter_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  recipient_count INTEGER DEFAULT 0,
  sent_by TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;
`

export async function GET() {
  try {
    // Test if table exists by selecting from it
    const { error } = await supabase
      .from('newsletter_sends')
      .select('id')
      .limit(1)

    if (!error) {
      return NextResponse.json({
        exists: true,
        message: 'newsletter_sends table already exists'
      })
    }

    // Table doesn't exist
    return NextResponse.json({
      exists: false,
      message: 'newsletter_sends table does not exist. Run the following SQL in the Supabase SQL Editor:',
      sql: CREATE_TABLE_SQL
    })
  } catch (error) {
    return NextResponse.json({
      exists: false,
      message: 'Could not check table. Run this SQL in Supabase SQL Editor:',
      sql: CREATE_TABLE_SQL
    })
  }
}
