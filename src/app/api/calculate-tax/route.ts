import { NextRequest, NextResponse } from 'next/server'
import { calculateSalesTax } from '@/lib/sales-tax'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subtotal, shipping_cost, shipping_address } = body

    if (subtotal === undefined || shipping_cost === undefined || !shipping_address) {
      return NextResponse.json(
        { error: 'Missing required fields for tax calculation' },
        { status: 400 }
      )
    }

    const taxCalculation = calculateSalesTax({
      subtotal: parseFloat(subtotal),
      shipping_cost: parseFloat(shipping_cost),
      shipping_address: {
        state: shipping_address.state,
        postal_code: shipping_address.postal_code,
        country: shipping_address.country || 'US'
      }
    })

    return NextResponse.json({
      success: true,
      tax_calculation: taxCalculation,
      total_with_tax: parseFloat(subtotal) + parseFloat(shipping_cost) + taxCalculation.tax_amount
    })

  } catch (error) {
    console.error('Error calculating tax:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}
