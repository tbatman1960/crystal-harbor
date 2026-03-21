import { supabase } from './supabase'

export interface AdminUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  active: boolean
  last_login: string | null
}

export interface AdminLoginData {
  email: string
  password: string
}

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  recentOrders: any[]
  topProducts: any[]
}

// Admin login
export async function loginAdmin(data: AdminLoginData): Promise<{ user?: AdminUser; error?: string }> {
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Login failed' }
    }

    return { user: result.user }
  } catch (error) {
    console.error('Admin login error:', error)
    return { error: 'Login failed. Please try again.' }
  }
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total orders and revenue
    const { data: orderStats } = await supabase
      .from('orders')
      .select('total_amount, status')

    const totalOrders = orderStats?.length || 0
    const totalRevenue = orderStats?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const pendingOrders = orderStats?.filter(order => order.status === 'pending').length || 0

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top products (simplified - would need more complex query for real data)
    const { data: topProducts } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        line_total,
        product_id
      `)
      .order('quantity', { ascending: false })
      .limit(5)

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      recentOrders: recentOrders || [],
      topProducts: topProducts || [],
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      recentOrders: [],
      topProducts: [],
    }
  }
}

// Get all orders for admin management
export async function getAllOrders(filters?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<{ orders: any[]; total: number }> {
  try {
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

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return { orders: [], total: 0 }
    }

    return { orders: data || [], total: count || 0 }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], total: 0 }
  }
}

// Update order status with enhanced functionality
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

          // Set a 5 second timeout for email sending
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          try {
            const emailResponse = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'status_update',
                data: emailData
              }),
              signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (emailResponse.ok) {
              console.log(`✅ Order status update email sent for ${currentOrder.order_number}`)
            } else {
              const errorData = await emailResponse.json()
              console.error('❌ Failed to send status update email:', errorData.error)
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId)
            if (fetchError?.name === 'AbortError') {
              console.warn('⏰ Status email sending timed out after 5 seconds')
            } else {
              console.error('❌ Error sending status update email:', fetchError)
            }
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

// Get individual order by ID
export async function getOrderById(orderId: string): Promise<{
  order?: any
  error?: string
}> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          line_total,
          selected_size,
          selected_color,
          custom_text,
          tier_applied
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return { error: 'Order not found' }
    }

    return { order }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get site settings
export async function getSiteSettings(): Promise<{ [key: string]: string }> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')

    if (error) {
      console.error('Error fetching site settings:', error)
      return {}
    }

    const settings: { [key: string]: string } = {}
    data?.forEach(setting => {
      settings[setting.key] = setting.value || ''
    })

    return settings
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return {}
  }
}

// Update site setting
export async function updateSiteSetting(key: string, value: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { 
          key, 
          value,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'key' 
        }
      )

    if (error) {
      console.error('Error updating site setting:', error)
      return { success: false, error: 'Failed to update setting' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating site setting:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}