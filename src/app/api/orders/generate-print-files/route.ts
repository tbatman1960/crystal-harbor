import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST — store a print-ready image for an order item
// Accepts either:
//   - imageBase64: client-rendered canvas (customization editor output)
//   - catalogImageUrl: URL to a catalog design image (server fetches it)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, itemIndex, imageBase64, catalogImageUrl } = body

    if (!orderNumber || itemIndex === undefined || (!imageBase64 && !catalogImageUrl)) {
      return NextResponse.json(
        { error: 'orderNumber, itemIndex, and either imageBase64 or catalogImageUrl are required' },
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

    let buffer: Buffer
    let contentType = 'image/png'
    let extension = 'png'

    if (imageBase64) {
      // Client-rendered customization — decode base64
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } else if (catalogImageUrl) {
      // Catalog design — fetch the image server-side
      try {
        const imageResponse = await fetch(catalogImageUrl)
        if (!imageResponse.ok) {
          console.error('Failed to fetch catalog image:', catalogImageUrl, imageResponse.status)
          return NextResponse.json({ error: 'Failed to fetch catalog design image' }, { status: 500 })
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)

        // Detect content type from response or URL
        const respContentType = imageResponse.headers.get('content-type') || ''
        if (respContentType.includes('jpeg') || respContentType.includes('jpg')) {
          contentType = 'image/jpeg'
          extension = 'jpg'
        } else if (respContentType.includes('webp')) {
          contentType = 'image/webp'
          extension = 'webp'
        }
      } catch (fetchError) {
        console.error('Error fetching catalog image:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch catalog design image' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const filePath = `print-files/order-${orderNumber}-print-${itemIndex}.${extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('customization')
      .upload(filePath, buffer, {
        contentType,
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
          source: imageBase64 ? 'customization-editor' : 'catalog-design',
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
