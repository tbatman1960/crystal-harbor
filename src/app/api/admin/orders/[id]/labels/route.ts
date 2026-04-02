import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { createShippingLabels } from '@/lib/carriers';
import { calculateOptimalPacking, cartItemsToPackingItems } from '@/lib/packing';

// Mock package types for now - in production these would come from the database
const PACKAGE_TYPES = [
  {
    id: 'small',
    name: 'Small Box',
    capacity_units: 10,
    max_weight_lbs: 5,
    length_inches: 10,
    width_inches: 8,
    height_inches: 6,
    empty_weight_lbs: 0.5,
    fallback_rate: 7.99,
    sort_order: 1
  },
  {
    id: 'medium',
    name: 'Medium Box',
    capacity_units: 25,
    max_weight_lbs: 15,
    length_inches: 14,
    width_inches: 12,
    height_inches: 8,
    empty_weight_lbs: 0.8,
    fallback_rate: 12.99,
    sort_order: 2
  },
  {
    id: 'large',
    name: 'Large Box',
    capacity_units: 50,
    max_weight_lbs: 30,
    length_inches: 18,
    width_inches: 16,
    height_inches: 12,
    empty_weight_lbs: 1.2,
    fallback_rate: 18.99,
    sort_order: 3
  }
];

/**
 * POST /api/admin/orders/[id]/labels - Create shipping labels for an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Load the order with items and shipping address
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shipping_address) {
      return NextResponse.json({ error: 'Order has no shipping address' }, { status: 400 });
    }

    // Check if labels already exist
    const { data: existingLabels } = await supabase
      .from('shipping_labels')
      .select('id')
      .eq('order_id', orderId)
      .limit(1);

    if (existingLabels && existingLabels.length > 0) {
      return NextResponse.json({ error: 'Labels already exist for this order' }, { status: 400 });
    }

    // Convert order items to packing items
    const packingItems = order.order_items.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      packing_units: 1, // Default - ideally this would come from product data
      weight_lbs: 0.5 * item.quantity // Default weight estimate
    }));

    // Calculate optimal packing
    const packingResult = calculateOptimalPacking(packingItems, PACKAGE_TYPES);

    if (packingResult.boxes.length === 0) {
      return NextResponse.json({ error: 'No packages could be calculated for this order' }, { status: 400 });
    }

    // Create shipping labels
    const labels = await createShippingLabels(order, packingResult.boxes);

    // Save label data to shipping_labels table
    const labelInserts = labels.map((label, index) => ({
      order_id: orderId,
      package_index: index,
      package_name: packingResult.boxes[index].package_type.name,
      tracking_number: label.tracking_number,
      carrier: 'usps',
      service_name: label.service_name,
      label_data: label.label_data,
      label_format: 'PDF',
      cost: label.cost || null,
      status: 'created'
    }));

    const { data: savedLabels, error: labelError } = await supabase
      .from('shipping_labels')
      .insert(labelInserts)
      .select('*');

    if (labelError) {
      console.error('Error saving labels:', labelError);
      return NextResponse.json({ error: 'Failed to save label data' }, { status: 500 });
    }

    // Update order with shipping details
    const trackingNumbers = labels.map(label => label.tracking_number);
    const labelSummary = labels.map((label, index) => ({
      package_name: packingResult.boxes[index].package_type.name,
      tracking_number: label.tracking_number,
      label_url: `/api/admin/orders/${orderId}/labels/${index}`,
      created_at: new Date().toISOString(),
      service_name: label.service_name
    }));

    const shippingDetails = {
      tracking_numbers: trackingNumbers,
      labels: labelSummary,
      shipping_method: 'usps',
      packages_count: labels.length,
      total_weight: packingResult.total_weight,
      created_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        shipping_details: shippingDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      // Don't fail the request - labels were created successfully
    }

    return NextResponse.json({
      success: true,
      labels: labelSummary,
      tracking_numbers: trackingNumbers,
      packages_count: labels.length,
      message: 'Shipping labels created successfully'
    });

  } catch (error) {
    console.error('Error creating shipping labels:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping labels' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[id]/labels - Get label status for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Get labels for this order
    const { data: labels, error: labelsError } = await supabase
      .from('shipping_labels')
      .select('*')
      .eq('order_id', orderId)
      .order('package_index');

    if (labelsError) {
      console.error('Error fetching labels:', labelsError);
      return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
    }

    // Get order shipping details
    const { data: order } = await supabase
      .from('orders')
      .select('shipping_details')
      .eq('id', orderId)
      .single();

    return NextResponse.json({
      success: true,
      labels: labels || [],
      shipping_details: order?.shipping_details || null,
      has_labels: labels && labels.length > 0
    });

  } catch (error) {
    console.error('Error fetching label status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch label status' },
      { status: 500 }
    );
  }
}