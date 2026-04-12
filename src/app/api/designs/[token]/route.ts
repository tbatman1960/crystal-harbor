import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET - View a shared design (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token || token.length !== 32) {
      return NextResponse.json({ 
        error: 'Invalid share token' 
      }, { status: 400 })
    }

    // Get shared design with comments
    const { data: sharedDesign, error } = await supabase
      .from('shared_designs')
      .select(`
        id,
        title,
        description,
        design_data,
        allow_feedback,
        click_count,
        created_at,
        expires_at
      `)
      .eq('share_token', token)
      .single()

    if (error || !sharedDesign) {
      return NextResponse.json({ 
        error: 'Shared design not found' 
      }, { status: 404 })
    }

    // Check if expired
    if (sharedDesign.expires_at && new Date(sharedDesign.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This shared design has expired' 
      }, { status: 410 })
    }

    // Increment click count (fire and forget)
    (async () => {
      try {
        await supabaseAdmin
          .from('shared_designs')
          .update({ 
            click_count: sharedDesign.click_count + 1 
          })
          .eq('share_token', token)
        
        // Also log analytics event
        try {
          await supabaseAdmin
            .from('design_share_analytics')
            .insert({
              shared_design_id: sharedDesign.id,
              event_type: 'view'
            })
        } catch (err) {
          console.warn('Failed to log analytics:', err)
        }
      } catch (err) {
        console.warn('Failed to update click count:', err)
      }
    })()

    // Get comments if feedback is allowed
    let comments: any[] = []
    if (sharedDesign.allow_feedback) {
      const { data: commentsData } = await supabase
        .from('design_comments')
        .select('id, commenter_name, comment_text, created_at')
        .eq('shared_design_id', sharedDesign.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50)

      comments = commentsData || []
    }

    return NextResponse.json({
      design: sharedDesign,
      comments,
      stats: {
        views: sharedDesign.click_count + 1,
        commentsCount: comments.length
      }
    })
  } catch (error) {
    console.error('Shared design API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Add comment to shared design
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { name, email, comment } = body

    if (!token || token.length !== 32) {
      return NextResponse.json({ 
        error: 'Invalid share token' 
      }, { status: 400 })
    }

    if (!name || !comment || name.trim().length === 0 || comment.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Name and comment are required' 
      }, { status: 400 })
    }

    if (comment.length > 1000) {
      return NextResponse.json({ 
        error: 'Comment too long (max 1000 characters)' 
      }, { status: 400 })
    }

    // Verify the shared design exists and allows feedback
    const { data: sharedDesign, error: designError } = await supabase
      .from('shared_designs')
      .select('id, allow_feedback, expires_at')
      .eq('share_token', token)
      .single()

    if (designError || !sharedDesign) {
      return NextResponse.json({ 
        error: 'Shared design not found' 
      }, { status: 404 })
    }

    if (!sharedDesign.allow_feedback) {
      return NextResponse.json({ 
        error: 'Comments are not enabled for this design' 
      }, { status: 403 })
    }

    // Check if expired
    if (sharedDesign.expires_at && new Date(sharedDesign.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This shared design has expired' 
      }, { status: 410 })
    }

    // Add the comment
    const { data: newComment, error: commentError } = await supabaseAdmin
      .from('design_comments')
      .insert({
        shared_design_id: sharedDesign.id,
        commenter_name: name.trim().substring(0, 100),
        commenter_email: email ? email.trim().substring(0, 255) : null,
        comment_text: comment.trim().substring(0, 1000),
        is_approved: true // Auto-approve for now, add moderation later if needed
      })
      .select()
      .single()

    if (commentError) {
      console.error('Comment creation error:', commentError)
      return NextResponse.json({ 
        error: 'Failed to add comment' 
      }, { status: 500 })
    }

    // Log analytics event (fire and forget)
    (async () => {
      try {
        await supabaseAdmin
          .from('design_share_analytics')
          .insert({
            shared_design_id: sharedDesign.id,
            event_type: 'comment_added'
          })
        // Analytics logged successfully
      } catch (err) {
        console.warn('Failed to log comment analytics:', err)
      }
    })()

    return NextResponse.json({ 
      comment: newComment,
      message: 'Comment added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Comment API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}