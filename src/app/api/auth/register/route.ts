import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country
    } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address_line_1: address_line_1 || null,
          address_line_2: address_line_2 || null,
          city: city || null,
          state: state || null,
          postal_code: postal_code || null,
          country: country || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      )
    }

    // Return user data (excluding sensitive info)
    const user = {
      id: newCustomer.id,
      email: newCustomer.email,
      firstName: newCustomer.first_name,
      lastName: newCustomer.last_name,
      phone: newCustomer.phone,
      address_line_1: newCustomer.address_line_1,
      address_line_2: newCustomer.address_line_2,
      city: newCustomer.city,
      state: newCustomer.state,
      postal_code: newCustomer.postal_code,
      country: newCustomer.country,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}