'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DesignSpecification } from '@/modules/customization/types'

interface SharedDesignData {
  id: string
  title: string
  description?: string
  design_data: DesignSpecification
  allow_feedback: boolean
  click_count: number
  created_at: string
  expires_at?: string
}

interface Comment {
  id: string
  commenter_name: string
  comment_text: string
  created_at: string
}

interface SharedDesignResponse {
  design: SharedDesignData
  comments: Comment[]
  stats: {
    views: number
    commentsCount: number
  }
}

export default function SharedDesignPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [data, setData] = useState<SharedDesignResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState({ name: '', email: '', comment: '' })
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentSubmitted, setCommentSubmitted] = useState(false)

  useEffect(() => {
    if (token) {
      fetchSharedDesign()
    }
  }, [token])

  const fetchSharedDesign = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/designs/${token}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load design')
      }
      
      setData(result)
    } catch (err) {
      console.error('Error loading shared design:', err)
      setError(err instanceof Error ? err.message : 'Failed to load design')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.name.trim() || !newComment.comment.trim()) {
      alert('Please enter your name and comment')
      return
    }
    
    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/designs/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit comment')
      }
      
      // Refresh the data to show new comment
      await fetchSharedDesign()
      setNewComment({ name: '', email: '', comment: '' })
      setCommentSubmitted(true)
      setTimeout(() => setCommentSubmitted(false), 3000)
    } catch (err) {
      console.error('Error submitting comment:', err)
      alert(err instanceof Error ? err.message : 'Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCreateYourOwn = () => {
    // Navigate to customization page for the same product
    if (data?.design.design_data.productId) {
      router.push(`/products/custom/${data.design.design_data.productId}`)
    } else {
      router.push('/products')
    }
  }

  const getShareableLinks = () => {
    const url = window.location.href
    const text = `Check out this custom design: ${data?.design.title}`
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing URLs
      copyLink: url
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Design Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const links = getShareableLinks()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">DearPast</h1>
            </div>
            <button
              onClick={() => router.push('/products')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Products
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Design header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.design.title}</h1>
            {data.design.description && (
              <p className="text-gray-600">{data.design.description}</p>
            )}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span>👁️ {data.stats.views} views</span>
              {data.design.allow_feedback && (
                <span>💬 {data.stats.commentsCount} comments</span>
              )}
              <span>📅 Shared {new Date(data.design.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Design preview */}
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              {data.design.design_data.previewImageUrl ? (
                <img
                  src={data.design.design_data.previewImageUrl}
                  alt={data.design.title}
                  className="max-w-full max-h-96 rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-2">🎨</div>
                  <p>Design Preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCreateYourOwn}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                🎨 Create Your Own Version
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Copy Link"
                >
                  🔗
                </button>
                <a
                  href={links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Share on Facebook"
                >
                  📘
                </a>
                <a
                  href={links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Share on Twitter"
                >
                  🐦
                </a>
                <a
                  href={links.pinterest}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Share on Pinterest"
                >
                  📌
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Comments section */}
        {data.design.allow_feedback && (
          <div className="bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Comments ({data.stats.commentsCount})
                </h2>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showComments ? 'Hide' : 'Show'} Comments
                </button>
              </div>
            </div>

            {showComments && (
              <div className="p-6">
                {/* Comment form */}
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <h3 className="font-medium text-gray-900 mb-4">Leave Feedback</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Your name *"
                      value={newComment.name}
                      onChange={(e) => setNewComment(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Your email (optional)"
                      value={newComment.email}
                      onChange={(e) => setNewComment(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="Share your thoughts about this design..."
                    value={newComment.comment}
                    onChange={(e) => setNewComment(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                    maxLength={1000}
                    required
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {newComment.comment.length}/1000 characters
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                  {commentSubmitted && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ Comment posted successfully!
                    </div>
                  )}
                </form>

                {/* Comments list */}
                <div className="space-y-4">
                  {data.comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  ) : (
                    data.comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{comment.commenter_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DearPast branding */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            Powered by <span className="font-medium text-gray-900">DearPast</span> - Custom Products Made Simple
          </p>
        </div>
      </main>
    </div>
  )
}