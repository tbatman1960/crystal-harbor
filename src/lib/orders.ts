import { supabaseAdmin as supabase } from './supabase'
import { calculateSalesTax } from './sales-tax'
import { sendEmail as sendEmailFn, generateOrderConfirmationEmail, generateOrderStatusEmail } from './email'
import { v4 as uuidv4 } from 'uuid'

export interface OrderItem {
  product_id: string
  product_name: string
  selected_size: string
  selected_color: string
  quantity: number
  unit_price: number
  line_total: number
  tier_applied: string
  custom_text?: string | null
  uploaded_file?: File | null
  selected_design?: { name: string } | null
}

export interface ShippingAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface CreateOrderData {
  customer_id?: string | null
  guest_email?: string | null
  shipping_address: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  shipping_method?: string
  shipping_details?: any // JSON data with package breakdown, carrier info, etc.
  tax_amount?: number
  total_amount: number
  stripe_payment_intent_id: string
  special_instructions?: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  guest_email: string | null
  status: string
  subtotal: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  stripe_payment_intent_id: string
  shipping_address: any
  special_instructions: string | null
  large_order_alert_sent: boolean
  created_at: string
  updated_at: string
}

// Create new order
export async function createOrder(data: CreateOrderData): Promise<{
  success: boolean
  order?: Order
  error?: string
}> {
  try {
    // Use provided tax amount if available, otherwise calculate
    let tax_amount: number
    if (data.tax_amount != null && data.tax_amount >= 0) {
      tax_amount = data.tax_amount
    } else {
      const taxCalculation = calculateSalesTax({
        subtotal: data.subtotal,
        shipping_cost: data.shipping_cost,
        shipping_address: {
          state: data.shipping_address.state,
          postal_code: data.shipping_address.postal_code,
          country: data.shipping_address.country || 'US'
        }
      })
      tax_amount = taxCalculation.tax_amount
    }
    const final_total = data.subtotal + data.shipping_cost + tax_amount

    // Start a transaction by creating the order first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: data.customer_id,
          guest_email: data.guest_email,
          status: 'pending',
          subtotal: data.subtotal,
          shipping_cost: data.shipping_cost,
          shipping_method: data.shipping_method || 'Standard Shipping',
          shipping_details: data.shipping_details || null,
          tax_amount: tax_amount,
          total_amount: final_total,
          stripe_payment_intent_id: data.stripe_payment_intent_id,
          shipping_address: data.shipping_address,
          special_instructions: data.special_instructions || null,
        },
      ])
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return { success: false, error: 'Failed to create order' }
    }

    // Create order items
    const orderItems = data.items.map((item) => ({
      id: uuidv4(),
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      selected_size: item.selected_size,
      selected_color: item.selected_color,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      tier_applied: item.tier_applied,
      custom_text: item.custom_text,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Try to clean up the order
      await supabase.from('orders').delete().eq('id', order.id)
      return { success: false, error: 'Failed to create order items' }
    }

    // Handle file uploads for items with uploaded files
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      const orderItemId = orderItems[i].id

      if (item.uploaded_file) {
        try {
          // Upload file to Supabase storage
          const fileExt = item.uploaded_file.name.split('.').pop()
          const fileName = `${orderItemId}-${Date.now()}.${fileExt}`
          const filePath = `order-files/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('order-files')
            .upload(filePath, item.uploaded_file)

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            continue // Continue with other files, don't fail the entire order
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('order-files')
            .getPublicUrl(filePath)

          // Save file info to uploaded_images table
          await supabase.from('uploaded_images').insert([
            {
              order_item_id: orderItemId,
              original_filename: item.uploaded_file.name,
              file_url: urlData.publicUrl,
              file_size: item.uploaded_file.size,
              file_type: item.uploaded_file.type,
            },
          ])

          // Update order item with image URL
          await supabase
            .from('order_items')
            .update({ uploaded_image_url: urlData.publicUrl })
            .eq('id', orderItemId)
        } catch (error) {
          console.error('Error handling file upload:', error)
          // Continue processing, don't fail the entire order
        }
      }
    }

    // Update customer address if this is a logged-in member
    if (data.customer_id && data.shipping_address) {
      try {
        await supabase
          .from('customers')
          .update({
            // Update basic customer info from shipping address
            first_name: data.shipping_address.first_name,
            last_name: data.shipping_address.last_name,
            phone: data.shipping_address.phone || null,
            // Save address information to the new columns
            address_line_1: data.shipping_address.address_line_1,
            address_line_2: data.shipping_address.address_line_2 || null,
            city: data.shipping_address.city,
            state: data.shipping_address.state,
            postal_code: data.shipping_address.postal_code,
            country: data.shipping_address.country || 'US',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.customer_id)
        
        console.log('Customer address updated successfully for customer:', data.customer_id)
      } catch (error) {
        console.error('Error updating customer info:', error)
        // Don't fail the order if customer update fails
      }
    }

    // Send order confirmation email (non-blocking, direct call since we're server-side)
    const sendEmailAsync = async () => {
      try {
        const customerEmail = data.customer_id ? data.shipping_address.email : data.guest_email || ''
        const customerName = `${data.shipping_address.first_name} ${data.shipping_address.last_name}`.trim()
        
        if (customerEmail) {
          const emailTemplate = generateOrderConfirmationEmail({
            orderNumber: order.order_number,
            customerName,
            customerEmail,
            items: data.items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
              selected_size: item.selected_size,
              selected_color: item.selected_color,
              custom_text: item.custom_text || undefined,
              selected_design: item.selected_design ? { name: item.selected_design.name } : undefined
            })),
            subtotal: data.subtotal,
            shipping_cost: data.shipping_cost,
            shipping_method: data.shipping_method || 'Standard Shipping',
            tax_amount: tax_amount,
            total_amount: final_total,
            shipping_address: data.shipping_address,
            estimated_delivery: undefined
          })

          const emailResult = await sendEmailFn(emailTemplate)
          if (emailResult.success) {
            console.log('✅ Order confirmation email sent successfully')
          } else {
            console.error('❌ Failed to send order confirmation email:', emailResult.error)
          }
        } else {
          console.warn('⚠️ No customer email available for order confirmation')
        }
      } catch (error) {
        console.error('Error in email sending process:', error)
      }
    }

    // Start email sending in the background, don't wait for it
    sendEmailAsync()
    
    console.log('📧 Email sending started in background, order completing...')

    // Tax amount is stored on the order itself — no separate recording needed

    // Check for large orders and send Telegram alert
    const hasLargeOrderItems = data.items.some((item) => item.quantity >= 100)
    if (hasLargeOrderItems) {
      await sendLargeOrderAlert(order, data.items)
    }

    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Send Telegram alert for large orders (100+ units)
async function sendLargeOrderAlert(order: Order, items: OrderItem[]) {
  try {
    const largeItems = items.filter((item) => item.quantity >= 100)
    
    if (largeItems.length === 0) return

    const customerName = order.customer_id 
      ? `Customer ID: ${order.customer_id}` 
      : `Guest: ${order.guest_email}`

    let alertMessage = `🚨 Large Order Alert!\n\n`
    alertMessage += `Order: ${order.order_number}\n`
    alertMessage += `${customerName}\n\n`
    alertMessage += `Large quantity items:\n`

    largeItems.forEach((item) => {
      alertMessage += `• ${item.product_name}: ${item.quantity} units\n`
    })

    alertMessage += `\nTotal: $${order.total_amount.toFixed(2)}\n`
    alertMessage += `Please verify stock availability with manufacturer.`

    // Send message via your messaging tool
    // This would use the message tool to send to Telegram
    console.log('Large order alert would be sent:', alertMessage)

    // Mark alert as sent
    await supabase
      .from('orders')
      .update({ large_order_alert_sent: true })
      .eq('id', order.id)

  } catch (error) {
    console.error('Error sending large order alert:', error)
  }
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<{
  order?: Order & { items: any[] }
  error?: string
}> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          uploaded_images (*)
        )
      `)
      .eq('order_number', orderNumber)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { error: 'Order not found' }
    }

    return { order: { ...order, items: order.order_items } }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { error: 'Failed to fetch order' }
  }
}

// Get customer orders
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customer orders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }
}

// Update order status (admin function) with email notification
export async function updateOrderStatus(
  orderId: string, 
  status: string, 
  options?: {
    trackingNumber?: string
    estimatedDelivery?: string
    statusMessage?: string
    sendEmail?: boolean
  }
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { sendEmail = true, trackingNumber, estimatedDelivery, statusMessage } = options || {}

    // Get the current order to access customer info
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching order for status update:', fetchError)
      return { success: false, error: 'Order not found' }
    }

    const previousStatus = currentOrder.status

    // Update the order status
    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: 'Failed to update order status' }
    }

    // Send status update email if enabled and customer email exists
    if (sendEmail && currentOrder.shipping_address?.email) {
      const sendStatusEmailAsync = async () => {
        try {
          const customerName = currentOrder.shipping_address.first_name && currentOrder.shipping_address.last_name
            ? `${currentOrder.shipping_address.first_name} ${currentOrder.shipping_address.last_name}`.trim()
            : 'Customer'

          const emailData = {
            orderNumber: currentOrder.order_number,
            customerName,
            customerEmail: currentOrder.shipping_address.email,
            newStatus: status,
            previousStatus,
            trackingNumber,
            estimatedDelivery,
            statusMessage
          }

          const emailTemplate = generateOrderStatusEmail(emailData)
          const emailResult = await sendEmailFn(emailTemplate)
          if (emailResult.success) {
            console.log(`✅ Order status update email sent for ${currentOrder.order_number}`)
          } else {
            console.error('❌ Failed to send status update email:', emailResult.error)
          }
        } catch (error) {
          console.error('Error in status email sending process:', error)
        }
      }

      // Start email sending in the background, don't wait for it
      sendStatusEmailAsync()
      console.log(`📧 Status update email sending started for order ${currentOrder.order_number}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}