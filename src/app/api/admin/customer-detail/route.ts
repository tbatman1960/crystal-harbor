import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Get customer details (exclude password hash)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, created_at, updated_at, address_line_1, address_line_2, city, state, postal_code, country')
      .eq('id', id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get customer orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, order_items')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    // Check subscriber status
    const { data: subscriber } = await supabase
      .from('email_subscribers')
      .select('subscribed')
      .ilike('email', customer.email)
      .single()

    return NextResponse.json({
      customer,
      orders: orders || [],
      isSubscriber: subscriber?.subscribed ?? false,
    })
  } catch (error) {
    console.error('Error fetching customer detail:', error)
    return NextResponse.json({ error: 'Failed to load customer' }, { status: 500 })
  }
}
