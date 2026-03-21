import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      exportType, 
      dateFrom, 
      dateTo, 
      includeCustomerDetails,
      includeProductDetails,
      format = 'csv'
    } = await request.json()

    // Validate export type
    const validTypes = ['orders', 'customers', 'products', 'financial', 'inventory']
    if (!validTypes.includes(exportType)) {
      return NextResponse.json(
        { error: 'Invalid export type' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let headers: string[] = []
    let filename = `${exportType}-export-${new Date().toISOString().split('T')[0]}`

    switch (exportType) {
      case 'orders':
        data = await exportOrdersData(dateFrom, dateTo, includeCustomerDetails, includeProductDetails)
        headers = getOrdersHeaders(includeCustomerDetails, includeProductDetails)
        break

      case 'customers':
        data = await exportCustomersData()
        headers = getCustomersHeaders()
        break

      case 'products':
        data = await exportProductsData(dateFrom, dateTo)
        headers = getProductsHeaders()
        break

      case 'financial':
        data = await exportFinancialData(dateFrom, dateTo)
        headers = getFinancialHeaders()
        break

      case 'inventory':
        data = await exportInventoryData()
        headers = getInventoryHeaders()
        break
    }

    // Generate CSV content
    const csvContent = [headers, ...data]
      .map(row => row.map((field: any) => {
        // Handle null/undefined values
        if (field === null || field === undefined) return ''
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const str = String(field)
        if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(','))
      .join('\\n')

    // Return CSV content
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

async function exportOrdersData(dateFrom?: string, dateTo?: string, includeCustomer = false, includeProducts = false) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data: orders, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return orders?.flatMap(order => {
    const baseOrderData = [
      order.order_number,
      new Date(order.created_at).toLocaleDateString(),
      new Date(order.created_at).toLocaleTimeString(),
      order.status,
      order.subtotal.toFixed(2),
      order.shipping_cost.toFixed(2),
      (order.tax_amount || 0).toFixed(2),
      order.total_amount.toFixed(2),
      order.stripe_payment_intent_id || '',
      order.special_instructions || ''
    ]

    const customerData = includeCustomer ? [
      order.shipping_address?.first_name || '',
      order.shipping_address?.last_name || '',
      order.guest_email || order.shipping_address?.email || '',
      order.shipping_address?.phone || '',
      order.shipping_address?.address_line_1 || '',
      order.shipping_address?.address_line_2 || '',
      order.shipping_address?.city || '',
      order.shipping_address?.state || '',
      order.shipping_address?.postal_code || '',
      order.shipping_address?.country || ''
    ] : []

    if (includeProducts && order.order_items?.length) {
      return order.order_items.map((item: any) => [
        ...baseOrderData,
        ...customerData,
        item.product_name,
        item.selected_size || '',
        item.selected_color || '',
        item.quantity.toString(),
        item.unit_price.toFixed(2),
        item.line_total.toFixed(2),
        item.tier_applied || '',
        item.custom_text || ''
      ])
    } else {
      return [[
        ...baseOrderData,
        ...customerData,
        order.order_items?.length.toString() || '0',
        order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0).toString() || '0'
      ]]
    }
  }) || []
}

async function exportCustomersData() {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get order counts and totals for each customer
  const { data: orderStats, error: orderError } = await supabase
    .from('orders')
    .select('customer_id, total_amount, created_at')

  if (orderError) throw orderError

  const customerStats: { [key: string]: { orders: number, total: number, lastOrder: string } } = {}
  orderStats?.forEach(order => {
    if (order.customer_id) {
      if (!customerStats[order.customer_id]) {
        customerStats[order.customer_id] = { orders: 0, total: 0, lastOrder: '' }
      }
      customerStats[order.customer_id].orders++
      customerStats[order.customer_id].total += order.total_amount
      if (!customerStats[order.customer_id].lastOrder || order.created_at > customerStats[order.customer_id].lastOrder) {
        customerStats[order.customer_id].lastOrder = order.created_at
      }
    }
  })

  return customers?.map(customer => {
    const stats = customerStats[customer.id] || { orders: 0, total: 0, lastOrder: '' }
    return [
      customer.email,
      customer.first_name || '',
      customer.last_name || '',
      customer.phone || '',
      customer.address_line_1 || '',
      customer.address_line_2 || '',
      customer.city || '',
      customer.state || '',
      customer.postal_code || '',
      customer.country || '',
      new Date(customer.created_at).toLocaleDateString(),
      stats.orders.toString(),
      stats.total.toFixed(2),
      stats.orders > 0 ? (stats.total / stats.orders).toFixed(2) : '0.00',
      stats.lastOrder ? new Date(stats.lastOrder).toLocaleDateString() : ''
    ]
  }) || []
}

async function exportProductsData(dateFrom?: string, dateTo?: string) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) throw error

  // Get sales data for products
  let orderQuery = supabase
    .from('orders')
    .select(`
      order_items (
        product_name,
        quantity,
        unit_price,
        line_total
      )
    `)

  if (dateFrom) orderQuery = orderQuery.gte('created_at', dateFrom)
  if (dateTo) orderQuery = orderQuery.lte('created_at', dateTo + 'T23:59:59')

  const { data: orders, error: orderError } = await orderQuery
  if (orderError) throw orderError

  // Calculate sales stats
  const productStats: { [key: string]: { sold: number, revenue: number } } = {}
  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = { sold: 0, revenue: 0 }
      }
      productStats[item.product_name].sold += item.quantity
      productStats[item.product_name].revenue += item.line_total
    })
  })

  return products?.map(product => {
    const stats = productStats[product.name] || { sold: 0, revenue: 0 }
    return [
      product.name,
      product.description || '',
      product.category_slug || '',
      product.base_price.toFixed(2),
      product.material || '',
      product.active ? 'Active' : 'Inactive',
      new Date(product.created_at).toLocaleDateString(),
      stats.sold.toString(),
      stats.revenue.toFixed(2),
      stats.sold > 0 ? (stats.revenue / stats.sold).toFixed(2) : '0.00'
    ]
  }) || []
}

async function exportFinancialData(dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from('orders')
    .select('*')

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data: orders, error } = await query.order('created_at')
  if (error) throw error

  return orders?.map(order => [
    order.order_number,
    new Date(order.created_at).toLocaleDateString(),
    order.status,
    order.subtotal.toFixed(2),
    order.shipping_cost.toFixed(2),
    (order.tax_amount || 0).toFixed(2),
    order.total_amount.toFixed(2),
    (order.total_amount - order.subtotal - order.shipping_cost - (order.tax_amount || 0)).toFixed(2), // Profit estimate
    order.shipping_address?.state || '',
    order.customer_id ? 'Member' : 'Guest'
  ]) || []
}

async function exportInventoryData() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')

  if (error) throw error

  // This is a basic inventory export - in a real system you'd have stock levels
  return products?.map(product => [
    product.name,
    product.category_slug || '',
    product.base_price.toFixed(2),
    'Custom Made', // Inventory status
    product.active ? 'Available' : 'Discontinued',
    new Date(product.created_at).toLocaleDateString(),
    new Date(product.updated_at).toLocaleDateString()
  ]) || []
}

function getOrdersHeaders(includeCustomer = false, includeProducts = false) {
  const base = [
    'Order Number', 'Date', 'Time', 'Status', 'Subtotal', 'Shipping', 'Tax', 'Total', 'Payment ID', 'Instructions'
  ]
  
  const customer = includeCustomer ? [
    'First Name', 'Last Name', 'Email', 'Phone', 'Address 1', 'Address 2', 'City', 'State', 'Zip', 'Country'
  ] : []

  const products = includeProducts ? [
    'Product', 'Size', 'Color', 'Quantity', 'Unit Price', 'Line Total', 'Tier', 'Custom Text'
  ] : ['Items Count', 'Total Units']

  return [...base, ...customer, ...products]
}

function getCustomersHeaders() {
  return [
    'Email', 'First Name', 'Last Name', 'Phone', 'Address 1', 'Address 2', 'City', 'State', 'Zip', 'Country',
    'Registration Date', 'Total Orders', 'Total Spent', 'Avg Order Value', 'Last Order'
  ]
}

function getProductsHeaders() {
  return [
    'Product Name', 'Description', 'Category', 'Base Price', 'Material', 'Status', 'Created Date',
    'Units Sold', 'Revenue Generated', 'Avg Selling Price'
  ]
}

function getFinancialHeaders() {
  return [
    'Order Number', 'Date', 'Status', 'Subtotal', 'Shipping', 'Tax', 'Total', 'Estimated Profit',
    'State', 'Customer Type'
  ]
}

function getInventoryHeaders() {
  return [
    'Product Name', 'Category', 'Price', 'Inventory Status', 'Availability', 'Created Date', 'Updated Date'
  ]
}