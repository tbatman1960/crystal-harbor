import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ isAdmin: false })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .ilike('email', email)
      .eq('active', true)
      .single()

    return NextResponse.json({ isAdmin: !!admin })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}
