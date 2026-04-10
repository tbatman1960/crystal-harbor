import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET /api/customization/config?product_id=xxx
// Public endpoint — returns customization config for a product
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('product_id')
    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    // Verify product exists and is customizable
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, base_price, is_customizable, customization_allow_text, customization_allow_image_upload, customization_allow_catalog_designs, customization_allow_ai_generation, customization_allow_style_transfer')
      .eq('id', productId)
      .eq('active', true)
      .eq('is_customizable', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or not customizable' }, { status: 404 })
    }

    // Fetch templates
    const { data: templates } = await supabase
      .from('product_templates')
      .select('*')
      .eq('product_id', productId)
      .order('color_name')

    // Fetch settings
    const { data: settings } = await supabase
      .from('product_customization_settings')
      .select('*')
      .eq('product_id', productId)
      .single()

    // Fetch catalog designs if enabled
    let catalogDesigns: any[] = []
    if (product.customization_allow_catalog_designs) {
      const { data: designs } = await supabase
        .from('design_catalog')
        .select('*')
        .order('name')
      catalogDesigns = designs || []
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        basePrice: product.base_price,
      },
      permissions: {
        allowText: product.customization_allow_text,
        allowImageUpload: product.customization_allow_image_upload,
        allowCatalogDesigns: product.customization_allow_catalog_designs,
        allowAiGeneration: product.customization_allow_ai_generation,
        allowStyleTransfer: product.customization_allow_style_transfer,
      },
      templates: (templates || []).map((t: any) => ({
        id: t.id,
        colorName: t.color_name,
        imageUrl: t.image_url,
        printableArea: {
          x: Number(t.printable_area_x),
          y: Number(t.printable_area_y),
          width: Number(t.printable_area_width),
          height: Number(t.printable_area_height),
        },
        physicalDimensions: {
          widthInches: Number(t.physical_width_inches),
          heightInches: Number(t.physical_height_inches),
        },
      })),
      textConstraints: settings ? {
        maxCharacters: settings.max_characters,
        maxLines: settings.max_lines,
        availableFonts: JSON.parse(settings.available_fonts || '[]'),
        availableColors: JSON.parse(settings.available_colors || '[]'),
      } : {
        maxCharacters: 100,
        maxLines: 5,
        availableFonts: ['Arial', 'Times New Roman', 'Impact', 'Georgia', 'Verdana'],
        availableColors: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#FFD700', '#008000'],
      },
      pricing: settings ? {
        baseFee: Number(settings.base_fee),
        perTextElementFee: Number(settings.per_text_element_fee),
        perImageFee: Number(settings.per_image_fee),
        aiGenerationFee: Number(settings.ai_generation_fee),
        aiUpscalingFee: Number(settings.ai_upscaling_fee),
        styleTransferFee: Number(settings.style_transfer_fee),
      } : {
        baseFee: 0, perTextElementFee: 0, perImageFee: 0,
        aiGenerationFee: 0, aiUpscalingFee: 0, styleTransferFee: 0,
      },
      catalogDesigns: catalogDesigns.map((d: any) => ({
        id: d.id,
        name: d.name,
        imageUrl: d.image_url || d.thumbnail_url,
        thumbnailUrl: d.thumbnail_url || d.image_url,
        category: d.category || 'General',
      })),
    })
  } catch (error) {
    console.error('Customization config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
