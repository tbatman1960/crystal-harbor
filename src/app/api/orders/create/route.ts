import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Basic validation
    if (!data.shipping_address || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order data' },
        { status: 400 }
      )
    }

    if (!data.stripe_payment_intent_id) {
      return NextResponse.json(
        { success: false, error: 'Missing payment intent ID' },
        { status: 400 }
      )
    }

    // Strip File objects from items (can't serialize them through API anyway)
    const sanitizedItems = data.items.map((item: any) => ({
      ...item,
      uploaded_file: null, // File uploads handled separately
    }))

    const result = await createOrder({
      ...data,
      items: sanitizedItems,
    })

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error: any) {
    console.error('Order creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
