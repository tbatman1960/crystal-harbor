import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, shipping_address } = await request.json()

    // Validate amount
    if (!amount || amount < 50) { // Minimum $0.50
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create payment intent configuration
    const paymentIntentConfig: any = {
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    }

    // Add shipping if provided
    if (shipping_address) {
      paymentIntentConfig.shipping = {
        name: `${shipping_address.first_name} ${shipping_address.last_name}`,
        phone: shipping_address.phone,
        address: {
          line1: shipping_address.address_line_1,
          line2: shipping_address.address_line_2 || undefined,
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country,
        },
      }
      
      paymentIntentConfig.metadata = {
        customer_email: shipping_address.email,
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing payment' },
      { status: 500 }
    )
  }
}