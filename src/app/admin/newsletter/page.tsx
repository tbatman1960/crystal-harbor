'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import {
  PaperAirplaneIcon,
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface NewsletterSend {
  id: string
  subject: string
  recipient_count: number
  status: string
  created_at: string
  sent_at: string | null
}

type Tab = 'compose' | 'history'
type ComposeMode = 'manual' | 'ai'

export default function AdminNewsletterPage() {
  const { isAuthenticated } = useAdminStore()
  const [activeTab, setActiveTab] = useState<Tab>('compose')
  const [composeMode, setComposeMode] = useState<ComposeMode>('manual')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; sent?: number; failed?: number; total?: number; error?: string } | null>(null)
  const [history, setHistory] = useState<NewsletterSend[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  const loadHistory = async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const res = await fetch('/api/admin/newsletter/history')
      const data = await res.json()
      if (data.error) setHistoryError(data.error)
      setHistory(data.history || [])
    } catch {
      setHistoryError('Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setBodyHtml(data.html)
        setComposeMode('manual') // Switch to manual to edit
      }
    } catch {
      alert('Failed to generate newsletter')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachmentFile(file)
    const reader = new FileReader()
    reader.onload = () => setAttachmentBase64(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      alert('Subject and body are required')
      return
    }
    if (!confirm('Send this newsletter to ALL active subscribers?')) return

    setIsSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          bodyHtml,
          bodyText: bodyHtml.replace(/<[^>]*>/g, ''),
          attachment: attachmentBase64 ? { data: attachmentBase64, filename: attachmentFile?.name } : null,
        }),
      })
      const data = await res.json()
      setSendResult(data)
    } catch {
      setSendResult({ success: false, error: 'Failed to send' })
    } finally {
      setIsSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Please log in to access the admin panel.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <h1 className="text-3xl font-bold text-primary-600">Newsletter</h1>

      {/* Tabs */}
      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'compose' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4 mr-2" />
          Compose
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          <ClockIcon className="w-4 h-4 mr-2" />
          Send History
        </button>
      </div>

      {activeTab === 'compose' && (
        <div className="space-y-6">
          {/* Compose Mode Toggle */}
          <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setComposeMode('manual')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                composeMode === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Manual
            </button>
            <button
              onClick={() => setComposeMode('ai')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                composeMode === 'ai' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-primary-600'
              }`}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI Generate
            </button>
          </div>

          {/* AI Compose */}
          {composeMode === 'ai' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-primary-600 mb-4">AI Newsletter Generator</h2>
              <p className="text-sm text-secondary-500 mb-4">
                Describe what you want and AI will generate professional newsletter HTML matching Crystal Harbor&apos;s branding.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Write a newsletter about our spring sale with 20% off all blankets and free shipping on orders over $50..."
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500 mb-4"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                  isGenerating || !aiPrompt.trim()
                    ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Generate Newsletter
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Compose / Edit */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-primary-600 mb-4">
              {composeMode === 'ai' && bodyHtml ? 'Edit Generated Newsletter' : 'Compose Newsletter'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Newsletter subject..."
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">HTML Body</label>
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="Paste or write your HTML email body here..."
                  rows={16}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500 font-mono text-sm"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <PaperClipIcon className="w-4 h-4 inline mr-1" />
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                />
                {attachmentFile && (
                  <p className="text-sm text-secondary-500 mt-1">
                    {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          {bodyHtml && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-600">Preview</h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              {showPreview && (
                <div className="p-6">
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={bodyHtml}
                      className="w-full border-0"
                      style={{ minHeight: '500px' }}
                      title="Email Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Send Result */}
          {sendResult && (
            <div className={`rounded-lg p-4 ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {sendResult.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={sendResult.success ? 'text-green-800' : 'text-red-800'}>
                  {sendResult.success
                    ? `Newsletter sent! ${sendResult.sent} of ${sendResult.total} delivered successfully.${sendResult.failed ? ` ${sendResult.failed} failed.` : ''}`
                    : sendResult.error || 'Failed to send newsletter'}
                </span>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !bodyHtml.trim()}
              className={`flex items-center px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
                isSending || !subject.trim() || !bodyHtml.trim()
                  ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                  : 'bg-accent-lime-600 text-white hover:bg-accent-lime-700'
              }`}
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                  Send to All Subscribers
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-primary-600">Send History</h2>
          </div>

          {historyLoading ? (
            <div className="text-center py-12 text-secondary-500">Loading...</div>
          ) : historyError ? (
            <div className="text-center py-12 text-secondary-500">{historyError}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">No newsletters sent yet</h3>
              <p className="mt-1 text-sm text-secondary-500">Sent newsletters will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Recipients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 text-sm text-secondary-900">{item.subject}</td>
                        <td className="px-6 py-4 text-sm text-secondary-500">{item.recipient_count}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'sent' ? 'bg-green-100 text-green-800' :
                            item.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-secondary-100 text-secondary-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-500">
                          {item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-secondary-200">
                {history.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="font-medium text-secondary-900">{item.subject}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-500">{item.recipient_count} recipients</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-800' :
                        item.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-secondary-100 text-secondary-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-secondary-400">
                      {item.sent_at ? new Date(item.sent_at).toLocaleString() : 'Not sent'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
