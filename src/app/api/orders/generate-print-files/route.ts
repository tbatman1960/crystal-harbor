import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST — receive a print-ready image (base64) and store it in Supabase Storage
// Called from the order success page after client-side canvas rendering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, itemIndex, imageBase64, filename } = body

    if (!orderNumber || itemIndex === undefined || !imageBase64) {
      return NextResponse.json(
        { error: 'orderNumber, itemIndex, and imageBase64 are required' },
        { status: 400 }
      )
    }

    // Verify order exists and is paid
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_intent_id')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.payment_intent_id) {
      return NextResponse.json({ error: 'Order not yet paid' }, { status: 403 })
    }

    // Decode base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage (print-files bucket, not publicly accessible)
    const filePath = `print-files/order-${orderNumber}-print-${itemIndex}.png`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('customization')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Print file upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload print file' }, { status: 500 })
    }

    // Update order item with print file path
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('id, customization_data')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

    if (orderItems && orderItems[itemIndex]) {
      const item = orderItems[itemIndex]
      const updatedSpec = {
        ...(item.customization_data || {}),
        printFileUrl: filePath,
        metadata: {
          ...(item.customization_data?.metadata || {}),
          printFileGenerated: new Date().toISOString(),
        },
      }

      await supabaseAdmin
        .from('order_items')
        .update({ customization_data: updatedSpec })
        .eq('id', item.id)
    }

    return NextResponse.json({ success: true, filePath })
  } catch (error) {
    console.error('Print file generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
