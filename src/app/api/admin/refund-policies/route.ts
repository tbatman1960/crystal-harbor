import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET - List all refund policies
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('refund_policies')
      .select('*')
      .order('status')

    if (error) {
      console.error('Error fetching refund policies:', error)
      return NextResponse.json({ policies: [] })
    }

    return NextResponse.json({ policies: data || [] })
  } catch (error) {
    console.error('Error fetching refund policies:', error)
    return NextResponse.json({ policies: [] })
  }
}

// PUT - Update a refund policy
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, refund_percentage, conditions, processing_fee_percentage, restocking_fee_percentage } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('refund_policies')
      .upsert({
        status,
        refund_percentage: refund_percentage || 0,
        conditions: conditions || '',
        processing_fee_percentage: processing_fee_percentage || 0,
        restocking_fee_percentage: restocking_fee_percentage || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'status'
      })

    if (error) {
      console.error('Error updating refund policy:', error)
      return NextResponse.json({ error: 'Failed to update refund policy' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating refund policy:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
