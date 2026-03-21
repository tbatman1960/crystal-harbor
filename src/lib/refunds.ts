import { supabase } from './supabase'

export interface RefundPolicy {
  id: string
  status: string
  refund_percentage: number
  conditions: string
  processing_fee_percentage: number
  restocking_fee_percentage: number
  created_at: string
  updated_at: string
}

export interface RefundRequest {
  id: string
  order_id: string
  order_number: string
  requested_amount: number
  refund_reason: string
  refund_type: 'full' | 'partial' | 'customer_cancellation'
  status: 'pending' | 'approved' | 'processed' | 'denied'
  processed_amount?: number
  stripe_refund_id?: string
  admin_notes?: string
  created_at: string
  processed_at?: string
}

// Get return policy for specific order status
export async function getRefundPolicy(orderStatus: string): Promise<RefundPolicy | null> {
  try {
    const { data, error } = await supabase
      .from('refund_policies')
      .select('*')
      .eq('status', orderStatus)
      .single()

    if (error) {
      console.error('Error fetching refund policy:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching refund policy:', error)
    return null
  }
}

// Get all refund policies (for admin configuration)
export async function getAllRefundPolicies(): Promise<RefundPolicy[]> {
  try {
    const { data, error } = await supabase
      .from('refund_policies')
      .select('*')
      .order('status')

    if (error) {
      console.error('Error fetching refund policies:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching refund policies:', error)
    return []
  }
}

// Update refund policy
export async function updateRefundPolicy(status: string, policy: Partial<RefundPolicy>): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase
      .from('refund_policies')
      .upsert({
        status,
        refund_percentage: policy.refund_percentage || 0,
        conditions: policy.conditions || '',
        processing_fee_percentage: policy.processing_fee_percentage || 0,
        restocking_fee_percentage: policy.restocking_fee_percentage || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'status'
      })

    if (error) {
      console.error('Error updating refund policy:', error)
      return { success: false, error: 'Failed to update refund policy' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating refund policy:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Calculate refund amount based on policy
export async function calculateRefundAmount(orderTotal: number, orderStatus: string): Promise<{
  refundAmount: number
  processingFee: number
  restockingFee: number
  netRefund: number
  policy?: RefundPolicy
}> {
  try {
    const policy = await getRefundPolicy(orderStatus)
    
    if (!policy) {
      // Default policy for pending orders - full refund
      if (orderStatus === 'pending') {
        return {
          refundAmount: orderTotal,
          processingFee: 0,
          restockingFee: 0,
          netRefund: orderTotal,
          policy: undefined
        }
      }
      
      // No refund policy found for this status
      return {
        refundAmount: 0,
        processingFee: 0,
        restockingFee: 0,
        netRefund: 0,
        policy: undefined
      }
    }

    const baseRefund = orderTotal * (policy.refund_percentage / 100)
    const processingFee = orderTotal * (policy.processing_fee_percentage / 100)
    const restockingFee = orderTotal * (policy.restocking_fee_percentage / 100)
    const netRefund = Math.max(0, baseRefund - processingFee - restockingFee)

    return {
      refundAmount: baseRefund,
      processingFee,
      restockingFee,
      netRefund,
      policy
    }
  } catch (error) {
    console.error('Error calculating refund amount:', error)
    return {
      refundAmount: 0,
      processingFee: 0,
      restockingFee: 0,
      netRefund: 0,
      policy: undefined
    }
  }
}

// Process Stripe refund
export async function processStripeRefund(
  paymentIntentId: string, 
  refundAmount: number,
  orderNumber: string
): Promise<{
  success: boolean
  refundId?: string
  error?: string
}> {
  try {
    const response = await fetch('/api/refunds/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          order_number: orderNumber
        }
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Refund processing failed' }
    }

    return { success: true, refundId: result.refund_id }
  } catch (error) {
    console.error('Error processing Stripe refund:', error)
    return { success: false, error: 'Network error occurred' }
  }
}

// Create refund request
export async function createRefundRequest(
  orderId: string,
  refundData: {
    refund_type: 'full' | 'partial' | 'customer_cancellation'
    requested_amount: number
    refund_reason: string
    admin_notes?: string
  }
): Promise<{
  success: boolean
  refundRequest?: RefundRequest
  error?: string
}> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single()

    if (orderError) {
      return { success: false, error: 'Order not found' }
    }

    const { data, error } = await supabase
      .from('refund_requests')
      .insert({
        order_id: orderId,
        order_number: order.order_number,
        refund_type: refundData.refund_type,
        requested_amount: refundData.requested_amount,
        refund_reason: refundData.refund_reason,
        admin_notes: refundData.admin_notes,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating refund request:', error)
      return { success: false, error: 'Failed to create refund request' }
    }

    return { success: true, refundRequest: data }
  } catch (error) {
    console.error('Error creating refund request:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Customer self-cancellation (pending orders only)
export async function customerCancelOrder(orderId: string, customerId?: string): Promise<{
  success: boolean
  refundAmount?: number
  error?: string
}> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      return { success: false, error: 'Order not found' }
    }

    // Verify customer ownership if customer ID provided
    if (customerId && order.customer_id !== customerId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if order is in pending status
    if (order.status !== 'pending') {
      return { success: false, error: 'Order cannot be cancelled. Please contact support.' }
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return { success: false, error: 'Failed to cancel order' }
    }

    // Create refund request for full amount
    const refundResult = await createRefundRequest(orderId, {
      refund_type: 'customer_cancellation',
      requested_amount: order.total_amount,
      refund_reason: 'Customer cancelled order while pending'
    })

    if (!refundResult.success) {
      console.error('Error creating refund request:', refundResult.error)
      return { success: false, error: 'Order cancelled but refund request failed' }
    }

    // Process automatic refund if payment intent exists
    if (order.stripe_payment_intent_id && !order.stripe_payment_intent_id.startsWith('dev_test_')) {
      const stripeRefund = await processStripeRefund(
        order.stripe_payment_intent_id,
        order.total_amount,
        order.order_number
      )

      if (stripeRefund.success) {
        // Update refund request as processed
        await supabase
          .from('refund_requests')
          .update({
            status: 'processed',
            processed_amount: order.total_amount,
            stripe_refund_id: stripeRefund.refundId,
            processed_at: new Date().toISOString()
          })
          .eq('id', refundResult.refundRequest!.id)

        console.log(`✅ Automatic refund processed for order ${order.order_number}`)
        return { success: true, refundAmount: order.total_amount }
      } else {
        console.error('Stripe refund failed:', stripeRefund.error)
        return { success: true, refundAmount: 0, error: 'Order cancelled but automatic refund failed. Manual processing required.' }
      }
    }

    return { success: true, refundAmount: order.total_amount }
  } catch (error) {
    console.error('Error in customer cancel order:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}