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

      case 'contact':
        emailTemplate = {
          to: process.env.SMTP_USER || 'info@crystalharbortc.com',
          subject: `Contact Form: ${data.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E3A8A;">New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <hr style="border: 1px solid #eee;" />
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${data.message}</p>
            </div>
          `,
          replyTo: data.email
        }
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