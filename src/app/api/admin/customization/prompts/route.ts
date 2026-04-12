import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

interface PromptExample {
  id?: string
  prompt_text: string
  category?: string
  product_types: string[]
  display_order: number
  is_active: boolean
}

// GET - List all prompt examples
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const productType = searchParams.get('productType')
    const activeOnly = searchParams.get('active') === 'true'

    let query = supabaseAdmin
      .from('ai_prompt_examples')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (productType) {
      // Filter by product type - either empty array (all products) or contains the specific type
      query = query.or(`product_types.eq.{},product_types.cs.{${productType}}`)
    }

    const { data: prompts, error } = await query

    if (error) {
      console.error('Prompts fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('Prompts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new prompt example
export async function POST(request: NextRequest) {
  try {
    const body: PromptExample = await request.json()
    
    const { prompt_text, category, product_types = [], display_order = 0 } = body

    if (!prompt_text || prompt_text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Prompt text is required' 
      }, { status: 400 })
    }

    if (prompt_text.length > 500) {
      return NextResponse.json({ 
        error: 'Prompt text too long (max 500 characters)' 
      }, { status: 400 })
    }

    const { data: prompt, error } = await supabaseAdmin
      .from('ai_prompt_examples')
      .insert({
        prompt_text: prompt_text.trim(),
        category: category || 'general',
        product_types: product_types,
        display_order: display_order,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Prompt creation error:', error)
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt }, { status: 201 })
  } catch (error) {
    console.error('Prompt creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update prompt example
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('id')
    
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 })
    }

    const body: Partial<PromptExample> = await request.json()
    const updateData: Record<string, any> = {}

    if (body.prompt_text !== undefined) {
      if (!body.prompt_text.trim()) {
        return NextResponse.json({ error: 'Prompt text cannot be empty' }, { status: 400 })
      }
      if (body.prompt_text.length > 500) {
        return NextResponse.json({ error: 'Prompt text too long (max 500 characters)' }, { status: 400 })
      }
      updateData.prompt_text = body.prompt_text.trim()
    }
    
    if (body.category !== undefined) updateData.category = body.category
    if (body.product_types !== undefined) updateData.product_types = body.product_types
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    const { data: prompt, error } = await supabaseAdmin
      .from('ai_prompt_examples')
      .update(updateData)
      .eq('id', promptId)
      .select()
      .single()

    if (error) {
      console.error('Prompt update error:', error)
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Prompt update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete prompt example
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('id')
    
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('ai_prompt_examples')
      .delete()
      .eq('id', promptId)

    if (error) {
      console.error('Prompt deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Prompt deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}