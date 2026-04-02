import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getTrackingInfo } from '@/lib/carriers';

/**
 * GET /api/admin/orders/[id]/tracking - Get tracking info for all packages in an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Get all labels/tracking numbers for this order
    const { data: labels, error: labelsError } = await supabase
      .from('shipping_labels')
      .select('tracking_number, package_name, package_index, service_name, created_at')
      .eq('order_id', orderId)
      .order('package_index');

    if (labelsError) {
      console.error('Error fetching labels:', labelsError);
      return NextResponse.json({ error: 'Failed to fetch tracking numbers' }, { status: 500 });
    }

    if (!labels || labels.length === 0) {
      return NextResponse.json({
        success: true,
        tracking: [],
        message: 'No tracking numbers found for this order'
      });
    }

    // Get tracking info for each package
    const trackingResults = await Promise.all(
      labels.map(async (label) => {
        try {
          const trackingInfo = await getTrackingInfo(label.tracking_number);
          return {
            package_name: label.package_name,
            package_index: label.package_index,
            tracking_number: label.tracking_number,
            service_name: label.service_name,
            label_created_at: label.created_at,
            tracking_info: trackingInfo
          };
        } catch (error) {
          console.error(`Error getting tracking for ${label.tracking_number}:`, error);
          return {
            package_name: label.package_name,
            package_index: label.package_index,
            tracking_number: label.tracking_number,
            service_name: label.service_name,
            label_created_at: label.created_at,
            tracking_info: {
              tracking_number: label.tracking_number,
              status: 'Error',
              events: []
            },
            error: 'Failed to get tracking information'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      tracking: trackingResults,
      total_packages: labels.length
    });

  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}