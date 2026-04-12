import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { DesignSpecification } from '@/modules/customization/types'

export const runtime = 'nodejs'

interface ShareDesignRequest {
  designData: DesignSpecification
  title?: string
  description?: string
  allowFeedback?: boolean
  expiresInDays?: number
}

// POST - Create a shareable link for a design
export async function POST(request: NextRequest) {
  try {
    const body: ShareDesignRequest = await request.json()
    const { designData, title, description, allowFeedback = false, expiresInDays } = body

    if (!designData || !designData.layers || designData.layers.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid design data' 
      }, { status: 400 })
    }

    // Generate unique share token
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let token = ''
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return token
    }

    let shareToken = generateToken()
    
    // Ensure token is unique
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('shared_designs')
        .select('id')
        .eq('share_token', shareToken)
        .single()
        
      if (!existing) break
      
      shareToken = generateToken()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ 
        error: 'Failed to generate unique share token' 
      }, { status: 500 })
    }

    // Calculate expiration date if specified
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
      : null

    // For this implementation, we'll store the design data directly in the shared_designs table
    // In production, you might want to save to customer_designs first and reference it
    const { data: sharedDesign, error } = await supabaseAdmin
      .from('shared_designs')
      .insert({
        design_id: designData.designId, // This might be null for new designs
        customer_id: null, // We'll extract from session/auth later
        share_token: shareToken,
        title: title || `${designData.productId} Design`,
        description,
        allow_feedback: allowFeedback,
        expires_at: expiresAt,
        // Store the design data in metadata for now
        design_data: designData
      })
      .select()
      .single()

    if (error) {
      console.error('Share creation error:', error)
      return NextResponse.json({ 
        error: 'Failed to create share link' 
      }, { status: 500 })
    }

    const shareUrl = `${request.nextUrl.origin}/designs/shared/${shareToken}`

    return NextResponse.json({ 
      shareToken,
      shareUrl,
      sharedDesign
    }, { status: 201 })
  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET - Get sharing stats/analytics for a user's shared designs
export async function GET(request: NextRequest) {
  try {
    // This would require authentication to get user-specific shared designs
    // For now, return a placeholder
    return NextResponse.json({ 
      shares: [],
      totalShares: 0,
      totalViews: 0,
      totalComments: 0
    })
  } catch (error) {
    console.error('Share stats API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}