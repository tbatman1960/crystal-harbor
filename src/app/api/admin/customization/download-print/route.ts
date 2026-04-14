import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — download a print file from Supabase Storage (admin only)
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path')

    if (!path || !path.startsWith('print-files/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('customization')
      .download(path)

    if (error || !data) {
      console.error('Print file download error:', error)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const arrayBuffer = await data.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
      },
    })
  } catch (error) {
    console.error('Download print file error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
