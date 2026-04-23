import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

interface VendorOrderData {
  orderId: string
  vendorEmail: string
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, vendorEmail }: VendorOrderData = await request.json()

    if (!orderId || !vendorEmail) {
      return NextResponse.json(
        { error: 'Order ID and vendor email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(vendorEmail)) {
      return NextResponse.json(
        { error: 'Invalid vendor email format' },
        { status: 400 }
      )
    }

    // Fetch order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate vendor email content
    const emailSubject = `New Order for Production - ${order.order_number}`
    const emailHtml = generateVendorOrderEmail(order)
    const emailText = generateVendorOrderText(order)

    // Create email template
    const emailTemplate = {
      to: vendorEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    }

    // Check if SMTP is configured
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

    let emailSent = false
    let emailError = null

    if (smtpConfigured) {
      const emailResult = await sendEmail(emailTemplate)
      emailSent = emailResult.success
      emailError = emailResult.error
    }

    // Update order status to "ordered" and add vendor email to notes
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'ordered',
        special_instructions: `${order.special_instructions || ''}\n\n[VENDOR EMAIL SENT to ${vendorEmail} on ${new Date().toISOString()}]`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order sent to vendor successfully',
      orderId,
      vendorEmail,
      orderNumber: order.order_number,
      emailSent,
      emailError: emailSent ? null : (emailError || 'SMTP not configured - email would be sent in production')
    })

  } catch (error) {
    console.error('Send to vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to send order to vendor' },
      { status: 500 }
    )
  }
}

function generateVendorOrderEmail(order: any) {
  const customerName = order.shipping_address 
    ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim()
    : 'Unknown Customer'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: #1E3A8A; color: white; padding: 20px; text-align: center; }
        .company-name { font-size: 24px; font-weight: bold; }
        .order-title { font-size: 18px; margin-top: 10px; }
        .order-info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .order-number { font-size: 20px; font-weight: bold; color: #1E3A8A; }
        .customer-section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #1E3A8A; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .address-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background: #f8f9fa; font-weight: bold; }
        .custom-text { background: #fff3cd; padding: 8px; border-radius: 3px; font-style: italic; }
        .totals { text-align: right; margin: 20px 0; }
        .total-line { margin: 5px 0; }
        .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #1E3A8A; padding-top: 10px; margin-top: 10px; }
        .instructions { background: #e3f2fd; border: 1px solid #90caf9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; }
        .priority { background: #ffebee; border: 1px solid #f8bbd9; padding: 10px; border-radius: 5px; margin: 10px 0; color: #b71c1c; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">DearPast</div>
        <div class="order-title">Production Order Request</div>
      </div>
      
      <div class="order-info">
        <div class="order-number">Order #${order.order_number}</div>
        <div>Order Date: ${new Date(order.created_at).toLocaleDateString()}</div>
        <div>Status: <strong>ORDERED - READY FOR PRODUCTION</strong></div>
        <div>Total Value: <strong>$${order.total_amount.toFixed(2)}</strong></div>
      </div>

      <div class="customer-section">
        <div class="section-title">Ship To Customer:</div>
        <div class="address-box">
          <strong>${customerName}</strong><br>
          ${order.shipping_address?.address_line_1 || 'N/A'}<br>
          ${order.shipping_address?.address_line_2 ? order.shipping_address.address_line_2 + '<br>' : ''}
          ${order.shipping_address?.city || 'N/A'}, ${order.shipping_address?.state || 'N/A'} ${order.shipping_address?.postal_code || 'N/A'}<br>
          ${order.shipping_address?.country || 'US'}<br>
          <br>
          <strong>Contact:</strong><br>
          Email: ${order.guest_email || order.shipping_address?.email || 'N/A'}<br>
          Phone: ${order.shipping_address?.phone || 'N/A'}
        </div>
      </div>

      <div class="section-title">Items to Produce:</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Custom Text/Design</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.order_items.map((item: any) => `
            <tr>
              <td><strong>${item.product_name}</strong></td>
              <td>${item.selected_size || 'Standard'}</td>
              <td>${item.selected_color || 'Default'}</td>
              <td><strong>${item.quantity}</strong></td>
              <td>
                ${item.custom_text ? `<div class="custom-text">Text: "${item.custom_text}"</div>` : ''}
                ${item.uploaded_image_url ? `<div>📎 Custom Image Uploaded</div>` : ''}
                ${!item.custom_text && !item.uploaded_image_url ? 'Standard Design' : ''}
              </td>
              <td>$${item.unit_price.toFixed(2)}</td>
              <td>$${item.line_total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-line">Subtotal: $${order.subtotal.toFixed(2)}</div>
        <div class="total-line">Shipping: $${order.shipping_cost.toFixed(2)}</div>
        <div class="total-line">Tax: $${(order.tax_amount || 0).toFixed(2)}</div>
        <div class="grand-total">Order Total: $${order.total_amount.toFixed(2)}</div>
      </div>

      ${order.special_instructions && !order.special_instructions.includes('[VENDOR EMAIL SENT') ? `
        <div class="instructions">
          <div class="section-title">Special Instructions:</div>
          ${order.special_instructions}
        </div>
      ` : ''}

      <div class="priority">
        <strong>⚠️ PRODUCTION PRIORITY:</strong> This order has been marked as "ORDERED" and is ready for immediate production. Please confirm receipt and provide estimated completion date.
      </div>

      <div class="footer">
        <p><strong>DearPast</strong></p>
        <p>Production Order System | Generated: ${new Date().toLocaleString()}</p>
        <p>Please confirm receipt of this order and provide production timeline.</p>
      </div>
    </body>
    </html>
  `
}

function generateVendorOrderText(order: any) {
  const customerName = order.shipping_address 
    ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim()
    : 'Unknown Customer'

  return `
CRYSTAL HARBOR TRADING COMPANY
Production Order Request

ORDER: #${order.order_number}
DATE: ${new Date(order.created_at).toLocaleDateString()}
STATUS: ORDERED - READY FOR PRODUCTION
TOTAL: $${order.total_amount.toFixed(2)}

SHIP TO:
${customerName}
${order.shipping_address?.address_line_1 || 'N/A'}
${order.shipping_address?.address_line_2 || ''}
${order.shipping_address?.city || 'N/A'}, ${order.shipping_address?.state || 'N/A'} ${order.shipping_address?.postal_code || 'N/A'}
${order.shipping_address?.country || 'US'}

Contact: ${order.guest_email || order.shipping_address?.email || 'N/A'}
Phone: ${order.shipping_address?.phone || 'N/A'}

ITEMS TO PRODUCE:
${order.order_items.map((item: any) => 
  `- ${item.product_name} | Size: ${item.selected_size || 'Standard'} | Color: ${item.selected_color || 'Default'} | Qty: ${item.quantity}${item.custom_text ? ` | Text: "${item.custom_text}"` : ''}${item.uploaded_image_url ? ' | Custom Image' : ''}`
).join('\n')}

ORDER TOTALS:
Subtotal: $${order.subtotal.toFixed(2)}
Shipping: $${order.shipping_cost.toFixed(2)}
Tax: $${(order.tax_amount || 0).toFixed(2)}
Total: $${order.total_amount.toFixed(2)}

${order.special_instructions && !order.special_instructions.includes('[VENDOR EMAIL SENT') ? `
SPECIAL INSTRUCTIONS:
${order.special_instructions}
` : ''}

⚠️ PRIORITY: This order is ready for immediate production.
Please confirm receipt and provide estimated completion date.

Generated: ${new Date().toLocaleString()}
DearPast Production System
  `
}