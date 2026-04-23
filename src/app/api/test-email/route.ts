import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Create test email
    const testEmail = {
      to: to,
      subject: 'DearPast - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center;">
            <h1>Crys<span style="color: #84cc16;">tal</span> Har<span style="color: #ff6b6b;">bor</span></h1>
            <h2>✅ Email System Test</h2>
          </div>
          
          <div style="padding: 20px;">
            <h3>🎉 Success!</h3>
            <p>If you're reading this, your email configuration is working correctly.</p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <strong>Test Details:</strong><br>
              • Sent to: ${to}<br>
              • Date: ${new Date().toLocaleString()}<br>
              • System: DearPast<br>
            </div>
            
            <p>Your customers will now receive:</p>
            <ul>
              <li>Order confirmation emails</li>
              <li>Newsletter emails (when implemented)</li>
              <li>Admin notifications</li>
            </ul>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This is a test email from DearPast.<br>
                If you didn't request this test, you can safely ignore it.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `DearPast - Email Test
      
✅ Success! Your email configuration is working correctly.

Test Details:
• Sent to: ${to}  
• Date: ${new Date().toLocaleString()}
• System: DearPast

Your customers will now receive order confirmations and other important emails.

This is a test email from DearPast.`
    }

    const result = await sendEmail(testEmail)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
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