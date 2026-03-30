import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get total orders and revenue
    const { data: orderStats } = await supabase
      .from('orders')
      .select('total_amount, status')

    const totalOrders = orderStats?.length || 0
    const totalRevenue = orderStats?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0
    const pendingOrders = orderStats?.filter((order: any) => order.status === 'pending').length || 0

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top products
    const { data: topProducts } = await supabase
      .from('order_items')
      .select('product_name, quantity, line_total, product_id')
      .order('quantity', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      recentOrders: recentOrders || [],
      topProducts: topProducts || [],
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      recentOrders: [],
      topProducts: [],
    })
  }
}
