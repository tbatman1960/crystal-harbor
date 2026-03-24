import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Webhook: Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`✅ Webhook received: ${event.type} (${event.id})`)

    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💰 Payment succeeded: ${paymentIntent.id} — $${(paymentIntent.amount / 100).toFixed(2)}`)

        // Update order status if we can find the order by payment intent ID
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, order_number, status')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (order && order.status === 'pending') {
          await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
          console.log(`📦 Order ${order.order_number} confirmed via webhook`)
        } else if (error) {
          // Order may not exist yet if webhook fires before client-side order creation
          console.log(`ℹ️ No matching order for payment intent ${paymentIntent.id} — may be processed client-side`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const failureMessage = paymentIntent.last_payment_error?.message || 'Unknown error'
        console.error(`❌ Payment failed: ${paymentIntent.id} — ${failureMessage}`)

        // Find and flag the order if it exists
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (order) {
          await supabase
            .from('orders')
            .update({
              status: 'payment_failed',
              special_instructions: `Payment failed: ${failureMessage}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
          console.log(`⚠️ Order ${order.order_number} marked as payment_failed`)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const refundAmount = (charge.amount_refunded / 100).toFixed(2)
        console.log(`💸 Refund processed: ${charge.payment_intent} — $${refundAmount}`)

        // Update order if found
        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, status')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .single()

        if (order) {
          // If fully refunded, mark as refunded; otherwise note partial refund
          const newStatus = charge.refunded ? 'refunded' : order.status
          await supabase
            .from('orders')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)
          console.log(`💸 Order ${order.order_number} updated — refund $${refundAmount}, fully refunded: ${charge.refunded}`)
        }
        break
      }

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
