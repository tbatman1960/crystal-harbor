import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')
    
    // Fetch orders
    let ordersQuery = supabase.from('orders').select(`
      *,
      order_items(*)
    `)
    
    if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate)
    if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate)
    
    const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: false })
    if (ordersError) throw ordersError

    // Fetch customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, created_at')
    if (customersError) throw customersError

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, base_price')
    if (productsError) throw productsError

    return NextResponse.json({
      orders: orders || [],
      customers: customers || [],
      products: products || []
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
  }
}
