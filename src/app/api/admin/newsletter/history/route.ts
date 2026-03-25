import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('newsletter_sends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ history: data })
  } catch (error) {
    console.error('Error fetching newsletter history:', error)
    return NextResponse.json({ history: [], error: 'Failed to fetch history. The newsletter_sends table may not exist yet.' })
  }
}
