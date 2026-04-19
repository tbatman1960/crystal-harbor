import { NextRequest, NextResponse } from 'next/server'
import { customerCancelOrder } from '@/lib/refunds'
import { sendEmail, generateOrderStatusEmail } from '@/lib/email'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { voidUSPSLabel } from '@/lib/carriers/usps'

export async function POST(request: NextRequest) {
  try {
    const { order_id, customer_id, order_number } = await request.json()

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Process customer cancellation
    const result = await customerCancelOrder(order_id, customer_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Void any USPS shipping labels to reclaim postage
    try {
      const { data: labels } = await supabase
        .from('shipping_labels')
        .select('tracking_number')
        .eq('order_id', order_id)

      if (labels && labels.length > 0) {
        for (const label of labels) {
          if (label.tracking_number) {
            const voidResult = await voidUSPSLabel(label.tracking_number)
            if (voidResult.success) {
              console.log(`✅ USPS label voided: ${label.tracking_number}`)
              await supabase
                .from('shipping_labels')
                .update({ status: 'voided' })
                .eq('tracking_number', label.tracking_number)
            } else {
              console.error(`Failed to void USPS label ${label.tracking_number}:`, voidResult.error)
            }
          }
        }
      }
    } catch (labelError) {
      console.error('Error voiding shipping labels:', labelError)
      // Don't fail the cancellation if label voiding fails
    }

    // Send cancellation confirmation email
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (!orderError && order?.shipping_address?.email) {
        const customerName = `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim()
        
        const emailData = {
          orderNumber: order.order_number,
          customerName,
          customerEmail: order.shipping_address.email,
          newStatus: 'cancelled',
          statusMessage: `Your order has been successfully cancelled. ${result.refundAmount ? `A refund of $${result.refundAmount.toFixed(2)} will be processed within 3-5 business days.` : 'Refund processing is pending.'}`
        }

        const emailTemplate = generateOrderStatusEmail(emailData)
        const emailResult = await sendEmail(emailTemplate)
        
        if (emailResult.success) {
          console.log(`✅ Order cancellation email sent for ${order.order_number}`)
        } else {
          console.error('Failed to send cancellation email:', emailResult.error)
        }
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError)
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      refundAmount: result.refundAmount,
      refundProcessed: result.refundAmount ? result.refundAmount > 0 : false
    })

  } catch (error) {
    console.error('Order cancellation API error:', error)
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