import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: Request) {
  try {
    const {
      customer_id,
      first_name,
      last_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country
    } = await request.json()

    if (!customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Update customer profile
    const { data, error } = await supabase
      .from('customers')
      .update({
        first_name,
        last_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Return updated user data
    const user = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}