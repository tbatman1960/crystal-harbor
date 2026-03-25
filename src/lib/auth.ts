import { supabaseAdmin as supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface LoginData {
  email: string
  password: string
}

// Register new customer
export async function registerCustomer(data: RegisterData): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Registration failed' }
    }

    return { user: result.user }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'Registration failed. Please try again.' }
  }
}

// Login customer
export async function loginCustomer(data: LoginData): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
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
    console.error('Login error:', error)
    return { error: 'Login failed. Please try again.' }
  }
}

// Update customer profile
export async function updateCustomerProfile(
  userId: string,
  data: Partial<RegisterData>
): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided
    if (data.firstName !== undefined) updateData.first_name = data.firstName
    if (data.lastName !== undefined) updateData.last_name = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address_line_1 !== undefined) updateData.address_line_1 = data.address_line_1
    if (data.address_line_2 !== undefined) updateData.address_line_2 = data.address_line_2
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.postal_code !== undefined) updateData.postal_code = data.postal_code
    if (data.country !== undefined) updateData.country = data.country

    // Password updates require separate API endpoint for security

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return {
      user: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        firstName: updatedCustomer.first_name,
        lastName: updatedCustomer.last_name,
        phone: updatedCustomer.phone,
        address_line_1: updatedCustomer.address_line_1,
        address_line_2: updatedCustomer.address_line_2,
        city: updatedCustomer.city,
        state: updatedCustomer.state,
        postal_code: updatedCustomer.postal_code,
        country: updatedCustomer.country,
      },
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return { error: 'Profile update failed. Please try again.' }
  }
}

// Get customer by ID
export async function getCustomerById(userId: string): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !customer) {
      return { error: 'Customer not found' }
    }

    return {
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        address_line_1: customer.address_line_1,
        address_line_2: customer.address_line_2,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postal_code,
        country: customer.country,
      },
    }
  } catch (error) {
    console.error('Get customer error:', error)
    return { error: 'Failed to get customer data' }
  }
}

// Password reset - generate reset token (simplified for demo)
export async function requestPasswordReset(email: string): Promise<{ success?: boolean; error?: string }> {
  try {
    // Check if customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single()

    if (!customer) {
      // Don't reveal if email exists or not for security
      return { success: true }
    }

    // In a real implementation, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send email with reset link
    
    // For demo purposes, just return success
    console.log(`Password reset requested for: ${email}`)
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: 'Password reset failed. Please try again.' }
  }
}