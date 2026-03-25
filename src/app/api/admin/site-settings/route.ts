import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET — fetch site settings, optionally filtered by category
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')
    
    let query = supabase.from('site_settings').select('*')
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST — save site settings (delete + insert for a category)
export async function POST(request: NextRequest) {
  try {
    const { category, settings } = await request.json()

    if (!category || !settings) {
      return NextResponse.json({ error: 'Category and settings are required' }, { status: 400 })
    }

    // Delete existing settings for this category
    await supabase
      .from('site_settings')
      .delete()
      .eq('category', category)

    // Insert new settings
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      category,
      key,
      value: (value as string) || ''
    }))

    const { error } = await supabase
      .from('site_settings')
      .insert(settingsArray)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving site settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
