import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

interface PendingOrder {
  id: string
  order_number: string
  status: string
  customer_name: string
  total_amount: number
  created_at: string
  days_pending: number
  items: Array<{
    product_name: string
    quantity: number
    selected_size: string | null
    selected_color: string | null
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Add security check for API key or admin authentication
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.CRON_API_KEY || 'crystal-harbor-cron-key'
    
    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all pending orders
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          selected_size,
          selected_color
        )
      `)
      .in('status', ['pending', 'ordered'])
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({
        message: 'No pending orders found',
        count: 0
      })
    }

    // Process orders and calculate days pending
    const processedOrders: PendingOrder[] = pendingOrders.map(order => {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        customer_name: order.shipping_address 
          ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim()
          : 'Unknown Customer',
        total_amount: order.total_amount,
        created_at: order.created_at,
        days_pending: daysDiff,
        items: order.order_items || []
      }
    })

    // Separate orders by status for different sections
    const pendingOrders_pending = processedOrders.filter(order => order.status === 'pending')
    const pendingOrders_ordered = processedOrders.filter(order => order.status === 'ordered')

    // Generate email content
    const emailSubject = `Daily Order Status Report - ${new Date().toLocaleDateString()}`
    
    const emailHtml = generateDailyReminderEmail({
      pendingOrders: pendingOrders_pending,
      orderedOrders: pendingOrders_ordered,
      date: new Date().toLocaleDateString()
    })

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'info@crystalharbortc.com'
    
    const emailTemplate = {
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
      text: generatePlainTextSummary(pendingOrders_pending, pendingOrders_ordered)
    }

    // Check if SMTP is configured
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

    if (smtpConfigured) {
      const emailResult = await sendEmail(emailTemplate)
      
      if (emailResult.success) {
        console.log('Daily reminder email sent successfully')
        return NextResponse.json({
          message: 'Daily reminder sent successfully',
          pendingCount: pendingOrders_pending.length,
          orderedCount: pendingOrders_ordered.length,
          totalCount: processedOrders.length,
          emailSent: true
        })
      } else {
        console.error('Failed to send daily reminder email:', emailResult.error)
        return NextResponse.json({
          message: 'Orders retrieved but email failed to send',
          pendingCount: pendingOrders_pending.length,
          orderedCount: pendingOrders_ordered.length,
          totalCount: processedOrders.length,
          emailSent: false,
          error: emailResult.error
        }, { status: 500 })
      }
    } else {
      console.log('SMTP not configured - email would be sent')
      return NextResponse.json({
        message: 'Daily reminder generated (SMTP not configured)',
        pendingCount: pendingOrders_pending.length,
        orderedCount: pendingOrders_ordered.length,
        totalCount: processedOrders.length,
        emailSent: false,
        note: 'Configure SMTP settings to send actual emails'
      })
    }

  } catch (error) {
    console.error('Daily reminder error:', error)
    return NextResponse.json(
      { error: 'Daily reminder failed' },
      { status: 500 }
    )
  }
}

function generateDailyReminderEmail({
  pendingOrders,
  orderedOrders,
  date
}: {
  pendingOrders: PendingOrder[]
  orderedOrders: PendingOrder[]
  date: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #1E3A8A; color: white; padding: 20px; text-align: center; }
        .company-name { font-size: 24px; font-weight: bold; }
        .date { font-size: 16px; margin-top: 5px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #1E3A8A; margin-bottom: 10px; border-bottom: 2px solid #1E3A8A; padding-bottom: 5px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .order { background: white; border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .order-number { font-weight: bold; color: #1E3A8A; }
        .order-total { font-weight: bold; }
        .customer-info { margin-bottom: 8px; }
        .items { font-size: 14px; color: #666; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; color: #856404; margin: 10px 0; }
        .urgent { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; }
        .no-orders { text-align: center; color: #666; font-style: italic; padding: 20px; }
        .stats { display: flex; justify-content: space-around; text-align: center; }
        .stat { padding: 10px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #1E3A8A; }
        .stat-label { font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Crystal Harbor Trading Company</div>
        <div class="date">Daily Order Status Report - ${date}</div>
      </div>
      
      <div class="summary">
        <div class="stats">
          <div class="stat">
            <div class="stat-number">${pendingOrders.length}</div>
            <div class="stat-label">Pending Orders</div>
          </div>
          <div class="stat">
            <div class="stat-number">${orderedOrders.length}</div>
            <div class="stat-label">Ordered (Not Shipped)</div>
          </div>
          <div class="stat">
            <div class="stat-number">${pendingOrders.length + orderedOrders.length}</div>
            <div class="stat-label">Total Active</div>
          </div>
        </div>
      </div>
      
      <!-- Urgent Alerts -->
      ${pendingOrders.filter(order => order.days_pending >= 7).length > 0 ? `
        <div class="alert urgent">
          <strong>⚠️ URGENT:</strong> ${pendingOrders.filter(order => order.days_pending >= 7).length} order(s) have been pending for 7+ days and need immediate attention!
        </div>
      ` : ''}
      
      ${pendingOrders.filter(order => order.days_pending >= 3).length > 0 ? `
        <div class="alert">
          <strong>⏰ Notice:</strong> ${pendingOrders.filter(order => order.days_pending >= 3).length} order(s) have been pending for 3+ days.
        </div>
      ` : ''}

      <!-- Pending Orders Section -->
      <div class="section">
        <div class="section-title">📋 Pending Orders (${pendingOrders.length})</div>
        ${pendingOrders.length === 0 ? `
          <div class="no-orders">🎉 No pending orders! All caught up.</div>
        ` : `
          ${pendingOrders.map(order => `
            <div class="order ${order.days_pending >= 7 ? 'urgent' : ''}">
              <div class="order-header">
                <div class="order-number">Order #${order.order_number}</div>
                <div class="order-total">$${order.total_amount.toFixed(2)}</div>
              </div>
              <div class="customer-info">
                <strong>Customer:</strong> ${order.customer_name} | 
                <strong>Days Pending:</strong> ${order.days_pending} ${order.days_pending >= 7 ? '🚨' : order.days_pending >= 3 ? '⚠️' : ''}
              </div>
              <div class="items">
                <strong>Items:</strong> ${order.items.map(item => 
                  `${item.quantity}x ${item.product_name}${item.selected_size ? ` (${item.selected_size})` : ''}${item.selected_color ? ` - ${item.selected_color}` : ''}`
                ).join(', ')}
              </div>
            </div>
          `).join('')}
        `}
      </div>

      <!-- Ordered but Not Shipped Section -->
      <div class="section">
        <div class="section-title">📦 Ordered (Not Yet Shipped) (${orderedOrders.length})</div>
        ${orderedOrders.length === 0 ? `
          <div class="no-orders">No orders currently with vendor.</div>
        ` : `
          ${orderedOrders.map(order => `
            <div class="order">
              <div class="order-header">
                <div class="order-number">Order #${order.order_number}</div>
                <div class="order-total">$${order.total_amount.toFixed(2)}</div>
              </div>
              <div class="customer-info">
                <strong>Customer:</strong> ${order.customer_name} | 
                <strong>Days Since Ordered:</strong> ${order.days_pending}
              </div>
              <div class="items">
                <strong>Items:</strong> ${order.items.map(item => 
                  `${item.quantity}x ${item.product_name}${item.selected_size ? ` (${item.selected_size})` : ''}${item.selected_color ? ` - ${item.selected_color}` : ''}`
                ).join(', ')}
              </div>
            </div>
          `).join('')}
        `}
      </div>

      <div class="footer">
        <p>Generated automatically by Crystal Harbor Trading Company admin system</p>
        <p>Access admin panel: <a href="http://localhost:3000/admin">Admin Dashboard</a></p>
      </div>
    </body>
    </html>
  `
}

function generatePlainTextSummary(pendingOrders: PendingOrder[], orderedOrders: PendingOrder[]) {
  return `
CRYSTAL HARBOR TRADING COMPANY
Daily Order Status Report - ${new Date().toLocaleDateString()}

SUMMARY:
- Pending Orders: ${pendingOrders.length}
- Ordered (Not Shipped): ${orderedOrders.length}
- Total Active Orders: ${pendingOrders.length + orderedOrders.length}

${pendingOrders.length > 0 ? `
PENDING ORDERS:
${pendingOrders.map(order => 
  `- Order #${order.order_number} | ${order.customer_name} | $${order.total_amount.toFixed(2)} | ${order.days_pending} days pending`
).join('\n')}
` : 'No pending orders.'}

${orderedOrders.length > 0 ? `
ORDERED (NOT SHIPPED):
${orderedOrders.map(order => 
  `- Order #${order.order_number} | ${order.customer_name} | $${order.total_amount.toFixed(2)} | ${order.days_pending} days since ordered`
).join('\n')}
` : 'No orders currently with vendor.'}

Access admin panel: http://localhost:3000/admin
  `
}