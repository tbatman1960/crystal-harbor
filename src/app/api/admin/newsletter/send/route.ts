import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { subject, bodyHtml, bodyText, attachment } = await request.json()

    if (!subject || !bodyHtml) {
      return NextResponse.json({ error: 'Subject and bodyHtml are required' }, { status: 400 })
    }

    // Fetch active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscriber_emails')
      .select('email')
      .eq('active', true)

    if (subError) throw subError
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 })
    }

    // Create newsletter record
    const { data: record, error: insertError } = await supabase
      .from('newsletter_sends')
      .insert({
        subject,
        body_html: bodyHtml,
        body_text: bodyText || null,
        attachment_name: attachment?.filename || null,
        recipient_count: subscribers.length,
        status: 'sending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create newsletter record:', insertError)
      // Continue sending even if record fails (table might not exist yet)
    }

    // Send in batches of 10
    const batchSize = 10
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(sub =>
          sendEmail({
            to: sub.email,
            subject,
            html: bodyHtml,
            text: bodyText,
          })
        )
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++
        } else {
          failed++
          const err = result.status === 'rejected' ? result.reason : result.value.error
          errors.push(String(err))
        }
      }

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Update record
    if (record?.id) {
      await supabase
        .from('newsletter_sends')
        .update({
          status: failed === subscribers.length ? 'failed' : 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: sent,
        })
        .eq('id', record.id)
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
      errors: errors.slice(0, 5), // Return first 5 errors
    })
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
