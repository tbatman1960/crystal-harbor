import nodemailer from 'nodemailer'

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
  from?: string // Optional custom from address
  replyTo?: string // Optional reply-to address
}

// Email configuration - add these to your .env.local
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || 'Crystal Harbor Trading Company <info@crystalharbortc.com>',
  // Force IPv4 to avoid IPv6 connectivity issues
  family: 4,
  // Add connection timeout
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
}

// Send email function
export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email sending in development if no SMTP config
    if (!EMAIL_CONFIG.auth.user) {
      console.log('📧 EMAIL WOULD BE SENT (No SMTP configured):')
      console.log('To:', template.to)
      console.log('Subject:', template.subject)
      console.log('HTML:', template.html.substring(0, 200) + '...')
      return { success: true }
    }

    const transporter = createTransporter()
    
    const info = await transporter.sendMail({
      from: template.from || EMAIL_CONFIG.from,
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: template.replyTo,
    })

    console.log('✅ Email sent successfully:', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Order confirmation email template
export function generateOrderConfirmationEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    line_total: number
    selected_size?: string
    selected_color?: string
    custom_text?: string
    selected_design?: { name: string }
  }>
  subtotal: number
  shipping_cost: number
  shipping_method?: string
  shipping_details?: {
    service_name?: string
    estimated_delivery?: string
    packages?: Array<{
      package_type: string
      utilization: number
      weight: number
      dimensions: string
    }>
    cost?: number
    is_fallback?: boolean
    description?: string
  }
  tax_amount?: number
  total_amount: number
  shipping_address: {
    first_name: string
    last_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  estimated_delivery?: string
}): EmailTemplate {
  const { 
    orderNumber, 
    customerName, 
    customerEmail, 
    items, 
    subtotal, 
    shipping_cost,
    shipping_method,
    shipping_details,
    tax_amount,
    total_amount,
    shipping_address,
    estimated_delivery 
  } = orderData

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0; vertical-align: top;">
        <div style="font-weight: 600; color: #374151;">${item.product_name}</div>
        ${item.selected_size ? `<div style="font-size: 14px; color: #6b7280;">Size: ${item.selected_size}</div>` : ''}
        ${item.selected_color ? `<div style="font-size: 14px; color: #6b7280;">Color: ${item.selected_color}</div>` : ''}
        ${item.selected_design ? `<div style="font-size: 14px; color: #6b7280;">Design: ${item.selected_design.name}</div>` : ''}
        ${item.custom_text ? `<div style="font-size: 14px; color: #6b7280;">Custom Text: "${item.custom_text}"</div>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: right; vertical-align: top;">
        <div style="font-weight: 600;">$${item.line_total.toFixed(2)}</div>
        <div style="font-size: 14px; color: #6b7280;">$${item.unit_price.toFixed(2)} × ${item.quantity}</div>
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order Confirmation - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc;">
  
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Crys<span style="color: #8A9DB8;">tal</span> Har<span style="color: #C4942A;">bor</span>
      </div>
      <div style="font-size: 18px; font-weight: 600;">Order Confirmed!</div>
      <div style="font-size: 16px; opacity: 0.9; margin-top: 8px;">Thank you for your order, ${customerName}!</div>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Order Summary -->
      <div style="margin-bottom: 30px;">
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
          <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">Order Details</div>
          <div><strong>Order Number:</strong> ${orderNumber}</div>
          <div><strong>Estimated Delivery:</strong> ${estimated_delivery || '2-3 weeks from order date'}</div>
        </div>
      </div>

      <!-- Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 18px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
      </div>

      <!-- Totals -->
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
            <td style="text-align: right; padding: 8px 0;">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">
              Shipping${shipping_details?.service_name ? ` (${shipping_details.service_name})` : shipping_method ? ` (${shipping_method})` : ''}:
              ${shipping_details?.packages && shipping_details.packages.length > 0 ? `<br><span style="font-size: 12px; color: #9ca3af;">Ships in ${shipping_details.packages.length} package${shipping_details.packages.length > 1 ? 's' : ''}</span>` : ''}
            </td>
            <td style="text-align: right; padding: 8px 0;">${shipping_cost === 0 ? 'FREE' : `$${shipping_cost.toFixed(2)}`}</td>
          </tr>
          ${tax_amount && tax_amount > 0 ? `<tr>
            <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
            <td style="text-align: right; padding: 8px 0;">$${tax_amount.toFixed(2)}</td>
          </tr>` : ''}
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 16px 0 8px 0; font-size: 18px; font-weight: 700; color: #1e3a8a;">Total:</td>
            <td style="text-align: right; padding: 16px 0 8px 0; font-size: 18px; font-weight: 700; color: #1e3a8a;">$${total_amount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 18px;">Shipping Address</h3>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; color: #374151;">
          ${shipping_address.first_name} ${shipping_address.last_name}<br>
          ${shipping_address.address_line_1}<br>
          ${shipping_address.address_line_2 ? `${shipping_address.address_line_2}<br>` : ''}
          ${shipping_address.city}, ${shipping_address.state} ${shipping_address.postal_code}<br>
          ${shipping_address.country}
        </div>
      </div>

      ${shipping_details?.packages && shipping_details.packages.length > 0 ? `
      <!-- Shipping Details -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 18px;">Shipping Details</h3>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px;">
          <div style="color: #166534; font-weight: 600; margin-bottom: 8px;">
            ${shipping_details.service_name || shipping_method || 'Standard Shipping'}
          </div>
          <div style="color: #15803d; font-size: 14px; margin-bottom: 12px;">
            Estimated Delivery: ${shipping_details.estimated_delivery || estimated_delivery || '5-7 business days'}
          </div>
          <div style="color: #166534; font-size: 14px; margin-bottom: 8px;">
            <strong>Package${shipping_details.packages.length > 1 ? 's' : ''} (${shipping_details.packages.length}):</strong>
          </div>
          ${shipping_details.packages.map((pkg, index) => `
            <div style="background: white; border: 1px solid #d1fae5; border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 13px; color: #166534;">
              Package ${index + 1}: ${pkg.package_type} (${pkg.dimensions})<br>
              <span style="color: #9ca3af;">Utilization: ${Math.round(pkg.utilization)}% • Weight: ${pkg.weight.toFixed(1)} lbs</span>
            </div>
          `).join('')}
          ${shipping_details.is_fallback ? `<div style="color: #92400e; font-size: 12px; margin-top: 8px;"><em>Rate calculated using our standard shipping chart</em></div>` : ''}
        </div>
      </div>
      ` : ''}

      <!-- What's Next -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin: 0 0 12px 0; font-size: 16px;">What Happens Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #166534;">
          <li>Your order will be reviewed and prepared for printing</li>
          <li>We'll send you design proofs if applicable</li>
          <li>Professional printing begins once approved</li>
          <li>Quality check and careful packaging</li>
          <li>Shipment with tracking information</li>
        </ul>
      </div>

      <!-- Cancel/Modify Order -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 30px; text-align: center;">
        <div style="color: #991b1b; font-size: 14px; margin-bottom: 8px;">
          <strong>Need to cancel or modify your order?</strong>
        </div>
        <div style="color: #7f1d1d; font-size: 13px; margin-bottom: 12px;">
          Pending orders can be cancelled for a full refund.
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/orders/${orderNumber}" 
           style="display: inline-block; background: #dc2626; color: white; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px;">
          View or Cancel Order
        </a>
      </div>

      <!-- Contact Info -->
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <div style="margin-bottom: 8px;">
          Questions about your order? Contact us at 
          <a href="mailto:info@crystalharbortc.com" style="color: #C4942A; text-decoration: none;">info@crystalharbortc.com</a> 
          or call (317) 997-5503
        </div>
        <div>Crystal Harbor Trading Company • Quality custom printing with no minimums</div>
      </div>

    </div>
  </div>

</body>
</html>`

  const text = `
Order Confirmation - ${orderNumber}

Hi ${customerName},

Thank you for your order! We've received your order and will begin processing it shortly.

ORDER DETAILS:
Order Number: ${orderNumber}
Estimated Delivery: ${estimated_delivery || '2-3 weeks from order date'}

ITEMS ORDERED:
${items.map(item => {
  let itemText = `${item.product_name} - $${item.line_total.toFixed(2)} (${item.quantity} × $${item.unit_price.toFixed(2)})`
  if (item.selected_size) itemText += `\n  Size: ${item.selected_size}`
  if (item.selected_color) itemText += `\n  Color: ${item.selected_color}`
  if (item.selected_design) itemText += `\n  Design: ${item.selected_design.name}`
  if (item.custom_text) itemText += `\n  Custom Text: "${item.custom_text}"`
  return itemText
}).join('\n\n')}

ORDER SUMMARY:
Subtotal: $${subtotal.toFixed(2)}
Shipping: $${shipping_cost.toFixed(2)}${shipping_details?.service_name ? ` (${shipping_details.service_name})` : shipping_method ? ` (${shipping_method})` : ''}${shipping_details?.packages && shipping_details.packages.length > 0 ? `\n  Ships in ${shipping_details.packages.length} package${shipping_details.packages.length > 1 ? 's' : ''}` : ''}
${tax_amount && tax_amount > 0 ? `Tax: $${tax_amount.toFixed(2)}\n` : ''}Total: $${total_amount.toFixed(2)}

SHIPPING TO:
${shipping_address.first_name} ${shipping_address.last_name}
${shipping_address.address_line_1}
${shipping_address.address_line_2 ? shipping_address.address_line_2 + '\n' : ''}${shipping_address.city}, ${shipping_address.state} ${shipping_address.postal_code}
${shipping_address.country}

${shipping_details?.packages && shipping_details.packages.length > 0 ? `SHIPPING DETAILS:
Service: ${shipping_details.service_name || shipping_method || 'Standard Shipping'}
Estimated Delivery: ${shipping_details.estimated_delivery || estimated_delivery || '5-7 business days'}
Packages: ${shipping_details.packages.length} package${shipping_details.packages.length > 1 ? 's' : ''}
${shipping_details.packages.map((pkg, index) => `  Package ${index + 1}: ${pkg.package_type} (${pkg.dimensions}) - ${pkg.weight.toFixed(1)} lbs`).join('\n')}
${shipping_details.is_fallback ? 'Rate calculated using our standard shipping chart\n' : ''}` : ''}

WHAT'S NEXT:
• Order review and preparation
• Design proofs (if applicable)  
• Professional printing
• Quality check and packaging
• Shipment with tracking

NEED TO CANCEL?
Pending orders can be cancelled for a full refund.
View or cancel your order: ${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/orders/${orderNumber}

Questions? Contact us at info@crystalharbortc.com or (317) 997-5503

Crystal Harbor Trading Company
Quality custom printing with no minimums
`

  return {
    to: customerEmail,
    subject: `Order Confirmation - ${orderNumber} - Crystal Harbor Trading Company`,
    html,
    text,
    replyTo: 'orders@crystalharbortc.com'
  }
}

// Newsletter welcome email template
export function generateWelcomeEmail(subscriberData: {
  email: string
  source: 'footer' | 'popup' | 'checkout'
  discountCode?: string | null
}): EmailTemplate {
  const { email, source, discountCode } = subscriberData

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Crystal Harbor!</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc;">
  
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
        Crys<span style="color: #8A9DB8;">tal</span> Har<span style="color: #C4942A;">bor</span>
      </div>
      <div style="font-size: 18px; font-weight: 600;">Welcome to Crystal Harbor!</div>
      <div style="font-size: 16px; opacity: 0.9; margin-top: 8px;">Thank you for subscribing to our newsletter</div>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <h2 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 24px;">You're In!</h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Welcome to the Crystal Harbor family! You'll be the first to know about new products, special offers, and custom printing tips.
        </p>
      </div>

      ${discountCode ? `
      <!-- Discount Code -->
      <div style="background: linear-gradient(135deg, #8A9DB8 0%, #65a30d 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px; color: white;">
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">🎁 Your Welcome Gift!</div>
        <div style="font-size: 16px; margin-bottom: 16px; opacity: 0.9;">Use this code for 10% off your first order:</div>
        <div style="background: rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; letter-spacing: 1px;">
          ${discountCode}
        </div>
        <div style="font-size: 14px; margin-top: 12px; opacity: 0.8;">Valid for 30 days • Minimum order $10</div>
      </div>
      ` : ''}

      <!-- What to Expect -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 18px;">What to Expect:</h3>
        <div style="space-y: 12px;">
          <div style="display: flex; margin-bottom: 12px;">
            <div style="color: #8A9DB8; margin-right: 12px; font-size: 20px;">🎨</div>
            <div>
              <strong style="color: #374151;">Design Inspiration</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Creative ideas and trends for custom printed products</span>
            </div>
          </div>
          <div style="display: flex; margin-bottom: 12px;">
            <div style="color: #C4942A; margin-right: 12px; font-size: 20px;">💰</div>
            <div>
              <strong style="color: #374151;">Exclusive Discounts</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Special offers and volume pricing alerts</span>
            </div>
          </div>
          <div style="display: flex; margin-bottom: 12px;">
            <div style="color: #3b82f6; margin-right: 12px; font-size: 20px;">🚀</div>
            <div>
              <strong style="color: #374151;">New Products</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Be the first to see new customization options</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h4 style="color: #1e40af; margin: 0 0 8px 0;">Ready to Create Something Amazing?</h4>
          <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">Upload your design, choose your product, and we'll handle the rest.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/products" 
             style="display: inline-block; background: linear-gradient(135deg, #C4942A 0%, #8A9DB8 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Browse Products →
          </a>
        </div>
      </div>

      <!-- Contact Info -->
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <div style="margin-bottom: 8px;">
          Questions? Contact us at 
          <a href="mailto:info@crystalharbortc.com" style="color: #C4942A; text-decoration: none;">info@crystalharbortc.com</a>
        </div>
        <div style="margin-bottom: 16px;">Crystal Harbor Trading Company • Quality custom printing with no minimums</div>
        <div style="font-size: 12px; color: #9ca3af;">
          You received this email because you subscribed to our newsletter at crystalharbor.com<br>
          <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> | 
          <a href="#" style="color: #9ca3af; text-decoration: underline;">Update preferences</a>
        </div>
      </div>

    </div>
  </div>

</body>
</html>`

  const text = `
Welcome to Crystal Harbor!

🎉 You're In!
Thank you for subscribing to our newsletter. You'll be the first to know about new products, special offers, and custom printing tips.

${discountCode ? `
🎁 Your Welcome Gift!
Use this code for 10% off your first order: ${discountCode}
Valid for 30 days • Minimum order $10
` : ''}

What to Expect:
🎨 Design Inspiration - Creative ideas and trends
💰 Exclusive Discounts - Special offers and volume pricing
🚀 New Products - First access to new customization options

Ready to Create Something Amazing?
Visit ${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/products to browse our products.

Questions? Contact us at info@crystalharbortc.com

Crystal Harbor Trading Company
Quality custom printing with no minimums

You received this email because you subscribed to our newsletter.
Reply with "UNSUBSCRIBE" to stop receiving these emails.
`

  return {
    to: email,
    subject: `Welcome to Crystal Harbor ${discountCode ? '+ Your 10% Discount!' : ''}`,
    html,
    text,
    replyTo: 'info@crystalharbortc.com'
  }
}

// Order status update email template
export function generateOrderStatusEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  newStatus: string
  previousStatus?: string
  trackingNumber?: string
  estimatedDelivery?: string
  statusMessage?: string
}): EmailTemplate {
  const { 
    orderNumber, 
    customerName, 
    customerEmail, 
    newStatus, 
    previousStatus,
    trackingNumber,
    estimatedDelivery,
    statusMessage 
  } = orderData

  // Status-specific content
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ordered':
        return {
          title: '📦 Order Sent to Production',
          message: 'Your order has been sent to our printing facility and production has begun.',
          color: '#3b82f6',
          icon: '🏭'
        }
      case 'in_production': 
        return {
          title: '🎨 Order in Production',
          message: 'Your custom items are currently being printed with professional quality materials.',
          color: '#8b5cf6', 
          icon: '⚙️'
        }
      case 'quality_check':
        return {
          title: '🔍 Quality Review',
          message: 'Your items have completed printing and are undergoing our quality inspection process.',
          color: '#10b981',
          icon: '✅'
        }
      case 'shipped':
        return {
          title: '🚚 Order Shipped!',
          message: 'Great news! Your order is on its way to you.',
          color: '#059669',
          icon: '📦'
        }
      case 'delivered':
        return {
          title: '🎉 Order Delivered',
          message: 'Your Crystal Harbor order has been delivered! We hope you love your custom items.',
          color: '#16a34a',
          icon: '🏠'
        }
      case 'cancelled':
        return {
          title: '❌ Order Cancelled',
          message: 'Your order has been cancelled. If you have questions, please contact our support team.',
          color: '#dc2626',
          icon: '🚫'
        }
      default:
        return {
          title: '📋 Order Status Update',
          message: `Your order status has been updated to: ${status}`,
          color: '#6b7280',
          icon: '📋'
        }
    }
  }

  const statusInfo = getStatusInfo(newStatus)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order Update - ${orderNumber}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc;">
  
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Crys<span style="color: #8A9DB8;">tal</span> Har<span style="color: #C4942A;">bor</span>
      </div>
      <div style="font-size: 18px; font-weight: 600;">Order Update</div>
      <div style="font-size: 16px; opacity: 0.9; margin-top: 8px;">Order ${orderNumber}</div>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 16px;">${statusInfo.icon}</div>
        <h2 style="color: ${statusInfo.color}; margin: 0 0 16px 0; font-size: 24px;">${statusInfo.title}</h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Hi ${customerName}, ${statusInfo.message}
        </p>
      </div>

      <!-- Status Details -->
      <div style="background: #f0f9ff; border-left: 4px solid ${statusInfo.color}; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
        <div style="font-weight: 600; color: #1e40af; margin-bottom: 12px;">Status Details</div>
        <div><strong>Order Number:</strong> ${orderNumber}</div>
        <div><strong>New Status:</strong> ${newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        ${trackingNumber ? `<div><strong>Tracking Number:</strong> ${trackingNumber}</div>` : ''}
        ${estimatedDelivery ? `<div><strong>Estimated Delivery:</strong> ${estimatedDelivery}</div>` : ''}
        ${statusMessage ? `<div style="margin-top: 12px;"><strong>Additional Info:</strong><br>${statusMessage}</div>` : ''}
      </div>

      ${trackingNumber ? `
      <!-- Tracking Information -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px;">
          <h4 style="color: #15803d; margin: 0 0 12px 0;">Track Your Package</h4>
          <p style="color: #166534; margin: 0 0 16px 0; font-size: 14px;">Use this tracking number to follow your shipment:</p>
          <div style="background: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #1e3a8a; letter-spacing: 1px;">
            ${trackingNumber}
          </div>
        </div>
      </div>
      ` : ''}

      ${newStatus.toLowerCase() === 'shipped' ? `
      <!-- What's Next for Shipped Orders -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #15803d; margin: 0 0 12px 0; font-size: 16px;">Your Package is On the Way!</h3>
        <ul style="margin: 0; padding-left: 20px; color: #166534;">
          <li>Track your package using the tracking number above</li>
          <li>Estimated delivery: ${estimatedDelivery || '3-7 business days'}</li>
          <li>Someone should be available to receive the package</li>
          <li>Contact us if you have any delivery concerns</li>
        </ul>
      </div>
      ` : ''}

      ${newStatus.toLowerCase() === 'delivered' ? `
      <!-- Delivered - Request Review -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">How Did We Do?</h3>
        <p style="color: #b45309; margin: 0 0 12px 0;">We'd love to hear about your experience with Crystal Harbor!</p>
        <ul style="margin: 0; padding-left: 20px; color: #b45309; font-size: 14px;">
          <li>Did your items arrive as expected?</li>
          <li>Are you happy with the print quality?</li>
          <li>Would you recommend us to friends?</li>
        </ul>
      </div>
      ` : ''}

      <!-- Contact Info -->
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <div style="margin-bottom: 8px;">
          Questions about your order? Contact us at 
          <a href="mailto:info@crystalharbortc.com" style="color: #C4942A; text-decoration: none;">info@crystalharbortc.com</a> 
          or call (317) 997-5503
        </div>
        <div>Crystal Harbor Trading Company • Quality custom printing with no minimums</div>
      </div>

    </div>
  </div>

</body>
</html>`

  const text = `
Order Status Update - ${orderNumber}

Hi ${customerName},

${statusInfo.title}
${statusInfo.message}

ORDER DETAILS:
Order Number: ${orderNumber}
New Status: ${newStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}
${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ''}
${statusMessage ? `\nAdditional Info: ${statusMessage}` : ''}

${newStatus.toLowerCase() === 'shipped' ? `
YOUR PACKAGE IS ON THE WAY!
• Track your package using the tracking number above
• Estimated delivery: ${estimatedDelivery || '3-7 business days'}
• Make sure someone is available to receive the package
• Contact us if you have any delivery concerns
` : ''}

${newStatus.toLowerCase() === 'delivered' ? `
HOW DID WE DO?
We'd love to hear about your experience with Crystal Harbor!
• Did your items arrive as expected?
• Are you happy with the print quality?
• Would you recommend us to friends?
` : ''}

Questions? Contact us at info@crystalharbortc.com or (317) 997-5503

Crystal Harbor Trading Company
Quality custom printing with no minimums
`

  return {
    to: customerEmail,
    subject: `${statusInfo.icon} Order ${orderNumber} - ${statusInfo.title}`,
    html,
    text,
    replyTo: 'info@crystalharbortc.com'
  }
}

// Password reset email template
export function generatePasswordResetEmail(data: {
  email: string
  customerName: string
  resetLink: string
}): EmailTemplate {
  const { email, customerName, resetLink } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc;">
  
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px 20px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        Crys<span style="color: #8A9DB8;">tal</span> Har<span style="color: #C4942A;">bor</span>
      </div>
      <div style="font-size: 18px; font-weight: 600;">Password Reset Request</div>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        <h2 style="color: #1e3a8a; margin: 0 0 16px 0; font-size: 24px;">Reset Your Password</h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Hi ${customerName}, we received a request to reset your password.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${resetLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 16px; margin-bottom: 30px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>⏰ This link expires in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 30px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
        </p>
      </div>

      <!-- Contact Info -->
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <div style="margin-bottom: 8px;">
          Need help? Contact us at 
          <a href="mailto:info@crystalharbortc.com" style="color: #C4942A; text-decoration: none;">info@crystalharbortc.com</a>
        </div>
        <div>Crystal Harbor Trading Company • Quality custom printing with no minimums</div>
      </div>

    </div>
  </div>

</body>
</html>`

  const text = `
Reset Your Password - Crystal Harbor Trading Company

Hi ${customerName},

We received a request to reset your password. Click the link below to set a new password:

${resetLink}

This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.

Need help? Contact us at info@crystalharbortc.com

Crystal Harbor Trading Company
Quality custom printing with no minimums
`

  return {
    to: email,
    subject: 'Reset Your Password - Crystal Harbor Trading Company',
    html,
    text,
    replyTo: 'info@crystalharbortc.com'
  }
}