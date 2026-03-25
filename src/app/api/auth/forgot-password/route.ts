import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import crypto from 'crypto'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: true }) // Don't reveal missing email
    }

    // Look up customer by email (case-insensitive)
    const { data: customer } = await supabase
      .from('customers')
      .select('id, email, first_name')
      .ilike('email', email)
      .single()

    if (customer) {
      // Generate secure token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Invalidate any existing unused tokens for this customer
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('customer_id', customer.id)
        .eq('used', false)

      // Store token
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
          customer_id: customer.id,
          token,
          expires_at: expiresAt.toISOString()
        })

      if (insertError) {
        console.error('Error storing reset token:', insertError)
      } else {
        // Build reset URL using request origin or env var
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const resetLink = `${origin}/auth/reset-password?token=${token}`

        // Send email (fire and forget)
        const emailTemplate = generatePasswordResetEmail({
          email: customer.email,
          customerName: customer.first_name || 'Customer',
          resetLink
        })

        sendEmail(emailTemplate).catch(err => {
          console.error('Error sending password reset email:', err)
        })
      }
    }

    // Always return success to not reveal if email exists
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: true }) // Still return success
  }
}
