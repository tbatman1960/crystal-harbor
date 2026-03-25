import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET - List all customers with order counts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, created_at, updated_at, address_line_1, city, state, postal_code, country')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: customers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get order counts and totals for each customer
    const customerIds = customers.map((c: any) => c.id)
    
    const { data: orderStats } = await supabase
      .from('orders')
      .select('customer_id, id, total_amount, status')
      .in('customer_id', customerIds)

    // Get subscriber status for each customer email
    const emails = customers.map((c: any) => c.email.toLowerCase())
    const { data: subscribers } = await supabase
      .from('email_subscribers')
      .select('email, subscribed')
      .in('email', emails)

    const subscriberMap: Record<string, boolean> = {}
    if (subscribers) {
      subscribers.forEach((s: any) => {
        subscriberMap[s.email.toLowerCase()] = s.subscribed
      })
    }

    // Build stats per customer
    const statsMap: Record<string, { orderCount: number; totalSpent: number; lastOrderDate: string | null }> = {}
    if (orderStats) {
      orderStats.forEach((order: any) => {
        if (!statsMap[order.customer_id]) {
          statsMap[order.customer_id] = { orderCount: 0, totalSpent: 0, lastOrderDate: null }
        }
        statsMap[order.customer_id].orderCount++
        if (order.status !== 'cancelled') {
          statsMap[order.customer_id].totalSpent += order.total_amount
        }
      })
    }

    const enrichedCustomers = customers.map((customer: any) => ({
      ...customer,
      orderCount: statsMap[customer.id]?.orderCount || 0,
      totalSpent: statsMap[customer.id]?.totalSpent || 0,
      isSubscriber: subscriberMap[customer.email.toLowerCase()] ?? false,
    }))

    return NextResponse.json({ customers: enrichedCustomers, total: enrichedCustomers.length })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// PATCH - Update customer (disable, reset password, edit info)
export async function PATCH(request: NextRequest) {
  try {
    const { customerId, action, data } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    if (action === 'reset-password') {
      if (!data?.newPassword || data.newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      const hash = await bcrypt.hash(data.newPassword, 10)
      const { error } = await supabase
        .from('customers')
        .update({ password_hash: hash, updated_at: new Date().toISOString() })
        .eq('id', customerId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Password reset successfully' })
    }

    if (action === 'update-info') {
      const updateData: any = { updated_at: new Date().toISOString() }
      if (data.first_name !== undefined) updateData.first_name = data.first_name
      if (data.last_name !== undefined) updateData.last_name = data.last_name
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.email !== undefined) updateData.email = data.email

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Customer updated successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE - Delete customer account
export async function DELETE(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Check for existing orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1)

    if (orders && orders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete customer with existing orders. Consider disabling the account instead.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
