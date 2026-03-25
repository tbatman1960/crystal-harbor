import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { generateDiscountCode, isValidEmail } from '@/lib/email-capture'
import { sendEmail, generateWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = body

    // Validate input
    if (!email || !source) {
      return NextResponse.json(
        { error: 'Email and source are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (!['footer', 'popup', 'checkout'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscriber_emails')
      .select('id, email, active')
      .eq('email', normalizedEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing subscriber:', checkError)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    // If subscriber exists and is active
    if (existingSubscriber && existingSubscriber.active) {
      return NextResponse.json(
        { message: 'Already subscribed', discountCode: null },
        { status: 200 }
      )
    }

    let discountCode: string | null = null
    
    // Generate discount code for popup subscriptions
    if (source === 'popup') {
      discountCode = generateDiscountCode(10)
    }

    // If subscriber exists but was inactive, reactivate
    if (existingSubscriber) {
      const { error: updateError } = await supabase
        .from('subscriber_emails')
        .update({
          active: true,
          discount_code: discountCode,
          discount_code_sent: source === 'popup',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscriber.id)

      if (updateError) {
        console.error('Error updating subscriber:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }
    } else {
      // Create new subscriber
      const { error: insertError } = await supabase
        .from('subscriber_emails')
        .insert({
          email: normalizedEmail,
          source,
          active: true,
          discount_code: discountCode,
          discount_code_sent: source === 'popup'
        })

      if (insertError) {
        console.error('Error creating subscriber:', insertError)
        
        // Check if it's a unique constraint error
        if (insertError.code === '23505') {
          return NextResponse.json(
            { message: 'Already subscribed', discountCode: null },
            { status: 200 }
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to subscribe' },
          { status: 500 }
        )
      }
    }

    // If popup subscription, also create discount code record
    if (source === 'popup' && discountCode) {
      const { error: discountError } = await supabase
        .from('discount_codes')
        .insert({
          code: discountCode,
          type: 'percentage',
          value: 10.00,
          min_order_amount: 0,
          usage_limit: 1,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          active: true
        })

      if (discountError) {
        console.error('Error creating discount code:', discountError)
        // Don't fail the subscription, just log the error
      }
    }

    // Send welcome email
    try {
      const welcomeEmail = generateWelcomeEmail({
        email: normalizedEmail,
        source: source as 'footer' | 'popup' | 'checkout',
        discountCode: discountCode
      })
      
      const emailResult = await sendEmail(welcomeEmail)
      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error)
        // Don't fail the subscription if email fails
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({
      message: 'Successfully subscribed!',
      discountCode: discountCode
    })

  } catch (error) {
    console.error('Subscribe email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}