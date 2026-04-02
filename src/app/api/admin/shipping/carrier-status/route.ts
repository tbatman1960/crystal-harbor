import { NextResponse } from 'next/server'
import { getCarrierStatus } from '@/lib/carriers'

// GET /api/admin/shipping/carrier-status - Get carrier availability and configuration status
export async function GET() {
  try {
    const carriers = await getCarrierStatus()

    return NextResponse.json({ carriers })
  } catch (error) {
    console.error('Error getting carrier status:', error)
    return NextResponse.json({ error: 'Failed to get carrier status' }, { status: 500 })
  }
}