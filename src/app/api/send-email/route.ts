import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateOrderConfirmationEmail, generateOrderStatusEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    let emailTemplate

    switch (type) {
      case 'order_confirmation':
        emailTemplate = generateOrderConfirmationEmail(data)
        break
      
      case 'status_update':
        emailTemplate = generateOrderStatusEmail(data)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    const result = await sendEmail(emailTemplate)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in send-email API:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}