import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { sendEmail as sendEmailFn, generateOrderStatusEmail } from '@/lib/email'

// GET - List all orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          line_total
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ orders: [], total: 0 })
    }

    return NextResponse.json({ orders: data || [], total: count || 0 })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ orders: [], total: 0 })
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, trackingNumber, estimatedDelivery, statusMessage, sendEmail = true } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
    }

    // Get the current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = currentOrder.status

    // Update the order status
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Send status update email if enabled
    if (sendEmail && currentOrder.shipping_address?.email) {
      try {
        const customerName = currentOrder.shipping_address.first_name && currentOrder.shipping_address.last_name
          ? `${currentOrder.shipping_address.first_name} ${currentOrder.shipping_address.last_name}`.trim()
          : 'Customer'

        const emailTemplate = generateOrderStatusEmail({
          orderNumber: currentOrder.order_number,
          customerName,
          customerEmail: currentOrder.shipping_address.email,
          newStatus: status,
          previousStatus,
          trackingNumber,
          estimatedDelivery,
          statusMessage
        })

        await sendEmailFn(emailTemplate).catch((err: any) => console.error('Email send error:', err))
      } catch (emailErr) {
        console.error('Error preparing status email:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
