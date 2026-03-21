import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id, amount, reason, metadata } = await request.json()

    // Validate required fields
    if (!payment_intent_id || !amount) {
      return NextResponse.json(
        { error: 'Payment intent ID and amount are required' },
        { status: 400 }
      )
    }

    // Skip actual Stripe processing for test payments
    if (payment_intent_id.startsWith('dev_test_') || payment_intent_id.startsWith('mobile_')) {
      console.log(`🧪 Test refund simulated for ${payment_intent_id}: $${(amount / 100).toFixed(2)}`)
      
      return NextResponse.json({
        success: true,
        refund_id: `re_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        status: 'succeeded',
        message: 'Test refund processed successfully'
      })
    }

    // Process real Stripe refund
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment_intent_id,
        amount: amount, // Amount in cents
        reason: reason || 'requested_by_customer',
        metadata: metadata || {}
      })

      console.log(`✅ Stripe refund processed: ${refund.id} for $${(refund.amount / 100).toFixed(2)}`)

      return NextResponse.json({
        success: true,
        refund_id: refund.id,
        amount: refund.amount,
        status: refund.status,
        message: 'Refund processed successfully'
      })

    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError)

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json(
          { error: 'Card error: ' + stripeError.message },
          { status: 400 }
        )
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: 'Invalid request: ' + stripeError.message },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Refund processing failed: ' + stripeError.message },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Refund API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}