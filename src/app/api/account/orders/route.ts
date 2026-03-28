import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customer_id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: data || [] })
  } catch (err) {
    console.error('Account orders API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
