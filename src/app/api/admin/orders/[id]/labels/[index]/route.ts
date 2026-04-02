import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * GET /api/admin/orders/[id]/labels/[index] - Download a specific shipping label PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const orderId = params.id;
    const packageIndex = parseInt(params.index, 10);

    if (isNaN(packageIndex) || packageIndex < 0) {
      return NextResponse.json({ error: 'Invalid package index' }, { status: 400 });
    }

    // Get the specific label
    const { data: label, error: labelError } = await supabase
      .from('shipping_labels')
      .select('*')
      .eq('order_id', orderId)
      .eq('package_index', packageIndex)
      .single();

    if (labelError || !label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    if (!label.label_data) {
      return NextResponse.json({ error: 'Label data not available' }, { status: 404 });
    }

    // Decode base64 label data
    const pdfData = Buffer.from(label.label_data, 'base64');

    // Get order info for filename
    const { data: order } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single();

    const filename = order 
      ? `shipping-label-${order.order_number}-${packageIndex + 1}.pdf`
      : `shipping-label-${orderId}-${packageIndex + 1}.pdf`;

    // Return PDF with appropriate headers
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfData.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error downloading label:', error);
    return NextResponse.json(
      { error: 'Failed to download label' },
      { status: 500 }
    );
  }
}