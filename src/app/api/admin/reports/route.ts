import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          selected_size,
          selected_color,
          custom_text,
          line_total
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ orders: ordersData || [] })
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
