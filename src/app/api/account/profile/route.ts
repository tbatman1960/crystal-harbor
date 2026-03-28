import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customer_id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    return NextResponse.json({ customer: data })
  } catch (err) {
    console.error('Account profile API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, ...updateData } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id)

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Account profile update API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
