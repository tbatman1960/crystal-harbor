'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Template {
  id: string
  color_name: string
  image_url: string
  printable_area_x: number
  printable_area_y: number
  printable_area_width: number
  printable_area_height: number
  physical_width_inches: number
  physical_height_inches: number
}

interface Settings {
  max_characters: number
  max_lines: number
  available_fonts: string[]
  available_colors: string[]
  base_fee: number
  per_text_element_fee: number
  per_image_fee: number
  ai_generation_fee: number
  ai_upscaling_fee: number
  style_transfer_fee: number
}

const DEFAULT_FONTS = [
  'Arial', 'Times New Roman', 'Impact', 'Comic Sans MS',
  'Courier New', 'Georgia', 'Trebuchet MS', 'Verdana',
  'Helvetica', 'Palatino', 'Garamond', 'Bookman',
]

const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#0000FF',
  '#FFD700', '#008000', '#FF69B4', '#800080',
  '#FF8C00', '#00CED1', '#8B4513', '#808080',
]

export default function CustomizationSettingsPage({
  params,
}: {
  params: { productId: string }
}) {
  const router = useRouter()
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [newColorName, setNewColorName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Printable area visual editor state
  type DragMode = 'draw' | 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<DragMode>('draw')
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragArea, setDragArea] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [origArea, setOrigArea] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const previewImgRef = useRef<HTMLImageElement>(null)
  const HANDLE_PCT = 4 // hit-target size in % for edges/corners

  // Settings
  const [settings, setSettings] = useState<Settings>({
    max_characters: 100,
    max_lines: 5,
    available_fonts: DEFAULT_FONTS.slice(0, 8),
    available_colors: DEFAULT_COLORS.slice(0, 8),
    base_fee: 0,
    per_text_element_fee: 0,
    per_image_fee: 0,
    ai_generation_fee: 0,
    ai_upscaling_fee: 0,
    style_transfer_fee: 0,
  })

  const [activeSection, setActiveSection] = useState<'templates' | 'text' | 'pricing'>('templates')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load product name
      const prodRes = await fetch(`/api/admin/products/${params.productId}`)
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProductName(prodData.product?.name || 'Unknown Product')
      }

      // Load templates
      const tplRes = await fetch(`/api/admin/customization/templates?product_id=${params.productId}`)
      if (tplRes.ok) {
        const tplData = await tplRes.json()
        setTemplates(tplData.templates || [])
      }

      // Load settings
      const setRes = await fetch(`/api/admin/customization/settings?product_id=${params.productId}`)
      if (setRes.ok) {
        const setData = await setRes.json()
        const s = setData.settings
        if (s) {
          setSettings({
            max_characters: s.max_characters || 100,
            max_lines: s.max_lines || 5,
            available_fonts: typeof s.available_fonts === 'string'
              ? JSON.parse(s.available_fonts)
              : s.available_fonts || DEFAULT_FONTS.slice(0, 8),
            available_colors: typeof s.available_colors === 'string'
              ? JSON.parse(s.available_colors)
              : s.available_colors || DEFAULT_COLORS.slice(0, 8),
            base_fee: Number(s.base_fee) || 0,
            per_text_element_fee: Number(s.per_text_element_fee) || 0,
            per_image_fee: Number(s.per_image_fee) || 0,
            ai_generation_fee: Number(s.ai_generation_fee) || 0,
            ai_upscaling_fee: Number(s.ai_upscaling_fee) || 0,
            style_transfer_fee: Number(s.style_transfer_fee) || 0,
          })
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Upload template image
  const handleUploadTemplate = async (file: File) => {
    if (!newColorName.trim()) {
      setMessage({ type: 'error', text: 'Enter a color name first' })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('product_id', params.productId)

      const uploadRes = await fetch('/api/admin/customization/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        setMessage({ type: 'error', text: 'Failed to upload image' })
        return
      }

      const { url } = await uploadRes.json()

      // Create template row
      const createRes = await fetch('/api/admin/customization/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: params.productId,
          color_name: newColorName.trim(),
          image_url: url,
        }),
      })

      if (createRes.ok) {
        const { template } = await createRes.json()
        setTemplates([...templates, template])
        setNewColorName('')
        setMessage({ type: 'success', text: 'Template added' })
      } else {
        setMessage({ type: 'error', text: 'Failed to create template' })
      }
    } catch (err) {
      console.error('Upload error:', err)
      setMessage({ type: 'error', text: 'Upload failed' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return

    const res = await fetch(`/api/admin/customization/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates(templates.filter(t => t.id !== id))
    }
  }

  // Update template printable area / dimensions
  const handleUpdateTemplate = async (id: string, updates: Partial<Template>) => {
    const res = await fetch('/api/admin/customization/templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })

    if (res.ok) {
      setTemplates(templates.map(t => t.id === id ? { ...t, ...updates } : t))
    }
  }

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/customization/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: params.productId,
          ...settings,
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  // Unified pointer helpers for draw/move/resize printable area (mouse + touch)
  const getPointerPercent = (e: React.MouseEvent | React.TouchEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  // Determine what the user tapped: a corner, edge, inside the rect, or empty space
  const hitTest = (px: number, py: number, tpl: Template): DragMode => {
    const { printable_area_x: ax, printable_area_y: ay, printable_area_width: aw, printable_area_height: ah } = tpl
    if (aw < 1 || ah < 1) return 'draw'
    const h = HANDLE_PCT
    const nearL = Math.abs(px - ax) < h
    const nearR = Math.abs(px - (ax + aw)) < h
    const nearT = Math.abs(py - ay) < h
    const nearB = Math.abs(py - (ay + ah)) < h
    const inX = px > ax - h && px < ax + aw + h
    const inY = py > ay - h && py < ay + ah + h
    // corners first
    if (nearT && nearL && inX && inY) return 'nw'
    if (nearT && nearR && inX && inY) return 'ne'
    if (nearB && nearL && inX && inY) return 'sw'
    if (nearB && nearR && inX && inY) return 'se'
    // edges
    if (nearT && inX) return 'n'
    if (nearB && inX) return 's'
    if (nearL && inY) return 'w'
    if (nearR && inY) return 'e'
    // inside → move
    if (px > ax && px < ax + aw && py > ay && py < ay + ah) return 'move'
    return 'draw'
  }

  const handleAreaStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, templateId: string) => {
    e.preventDefault()
    const { x, y } = getPointerPercent(e, e.currentTarget)
    const tpl = templates.find(t => t.id === templateId)!
    const mode = hitTest(x, y, tpl)
    setEditingTemplateId(templateId)
    setIsDragging(true)
    setDragMode(mode)
    setDragStart({ x, y })
    const cur = { x: tpl.printable_area_x, y: tpl.printable_area_y, w: tpl.printable_area_width, h: tpl.printable_area_height }
    setOrigArea(cur)
    if (mode === 'draw') {
      setDragArea({ x, y, w: 0, h: 0 })
    } else {
      setDragArea(cur)
    }
  }

  const handleAreaMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, templateId: string) => {
    if (!isDragging || editingTemplateId !== templateId || !dragStart || !origArea) return
    e.preventDefault()
    const { x, y } = getPointerPercent(e, e.currentTarget)
    const dx = x - dragStart.x
    const dy = y - dragStart.y
    const r = (v: number) => Math.round(v * 10) / 10
    const clamp = (v: number) => Math.max(0, Math.min(100, v))

    if (dragMode === 'draw') {
      setDragArea({
        x: r(Math.min(dragStart.x, x)),
        y: r(Math.min(dragStart.y, y)),
        w: r(Math.abs(dx)),
        h: r(Math.abs(dy)),
      })
    } else if (dragMode === 'move') {
      let nx = clamp(origArea.x + dx)
      let ny = clamp(origArea.y + dy)
      if (nx + origArea.w > 100) nx = 100 - origArea.w
      if (ny + origArea.h > 100) ny = 100 - origArea.h
      setDragArea({ x: r(nx), y: r(ny), w: origArea.w, h: origArea.h })
    } else {
      // Resize from edge/corner
      let { x: nx, y: ny, w: nw, h: nh } = origArea
      if (dragMode.includes('n')) { ny = clamp(origArea.y + dy); nh = origArea.h - dy }
      if (dragMode.includes('s')) { nh = origArea.h + dy }
      if (dragMode.includes('w')) { nx = clamp(origArea.x + dx); nw = origArea.w - dx }
      if (dragMode.includes('e')) { nw = origArea.w + dx }
      // Enforce minimums
      if (nw < 3) { nw = 3; if (dragMode.includes('w')) nx = origArea.x + origArea.w - 3 }
      if (nh < 3) { nh = 3; if (dragMode.includes('n')) ny = origArea.y + origArea.h - 3 }
      if (nx + nw > 100) nw = 100 - nx
      if (ny + nh > 100) nh = 100 - ny
      setDragArea({ x: r(nx), y: r(ny), w: r(nw), h: r(nh) })
    }
  }

  const commitArea = (templateId: string, area: { x: number; y: number; w: number; h: number }) => {
    handleUpdateTemplate(templateId, {
      printable_area_x: area.x,
      printable_area_y: area.y,
      printable_area_width: area.w,
      printable_area_height: area.h,
    })
    setTemplates(prev => prev.map(t => t.id === templateId ? {
      ...t, printable_area_x: area.x, printable_area_y: area.y,
      printable_area_width: area.w, printable_area_height: area.h,
    } : t))
  }

  const handleAreaEnd = () => {
    if (editingTemplateId && dragArea && dragArea.w > 1 && dragArea.h > 1) {
      commitArea(editingTemplateId, dragArea)
    }
    setIsDragging(false)
    setDragStart(null)
    setDragArea(null)
    setOrigArea(null)
    setEditingTemplateId(null)
  }

  const toggleFont = (font: string) => {
    setSettings(s => ({
      ...s,
      available_fonts: s.available_fonts.includes(font)
        ? s.available_fonts.filter(f => f !== font)
        : [...s.available_fonts, font],
    }))
  }

  const toggleColor = (color: string) => {
    setSettings(s => ({
      ...s,
      available_colors: s.available_colors.includes(color)
        ? s.available_colors.filter(c => c !== color)
        : [...s.available_colors, color],
    }))
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="text-center py-12 loading-pulse">Loading customization settings...</div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/products/${params.productId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-600">
            Customization Settings
          </h1>
          <p className="text-secondary-600 text-sm">{productName}</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'templates' as const, label: '📸 Templates & Print Areas' },
          { key: 'text' as const, label: '✏️ Text Constraints' },
          { key: 'pricing' as const, label: '💰 Pricing' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSection === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {/* ─── Templates ─── */}
        {activeSection === 'templates' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Upload a clean product image for each available color. Then draw the printable area on each template
              and set the physical print dimensions.
            </p>

            {/* Existing templates */}
            {templates.map(tpl => (
              <div key={tpl.id} className="card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{tpl.color_name}</h3>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Image with printable area overlay — draw with mouse or finger */}
                <div
                  className="relative inline-block cursor-crosshair select-none border border-gray-200 rounded touch-none"
                  onMouseDown={(e) => handleAreaStart(e, tpl.id)}
                  onMouseMove={(e) => handleAreaMove(e, tpl.id)}
                  onMouseUp={handleAreaEnd}
                  onMouseLeave={handleAreaEnd}
                  onTouchStart={(e) => handleAreaStart(e, tpl.id)}
                  onTouchMove={(e) => handleAreaMove(e, tpl.id)}
                  onTouchEnd={handleAreaEnd}
                  onTouchCancel={handleAreaEnd}
                >
                  <img
                    ref={previewImgRef}
                    src={tpl.image_url}
                    alt={tpl.color_name}
                    className="w-full max-w-md max-h-96 block"
                    draggable={false}
                  />
                  {/* Show rectangle: live drag area if dragging, otherwise saved area */}
                  {(() => {
                    const active = isDragging && editingTemplateId === tpl.id && dragArea
                    const area = active ? dragArea : (tpl.printable_area_width > 0 && tpl.printable_area_height > 0 ? {
                      x: tpl.printable_area_x, y: tpl.printable_area_y, w: tpl.printable_area_width, h: tpl.printable_area_height,
                    } : null)
                    if (!area) return null
                    return (
                      <div
                        className={`absolute pointer-events-none ${active ? 'border-2 border-dashed border-blue-400 bg-blue-400/20' : 'border-2 border-blue-500 bg-blue-500/10'}`}
                        style={{
                          left: `${area.x}%`, top: `${area.y}%`,
                          width: `${area.w}%`, height: `${area.h}%`,
                        }}
                      >
                        {!active && (
                          <span className="absolute -top-5 left-0 text-xs text-blue-600 bg-white px-1 rounded whitespace-nowrap">
                            Printable Area — drag to move, edges to resize
                          </span>
                        )}
                        {/* Corner handles (visible when not actively dragging) */}
                        {!active && (
                          <>
                            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                              <div key={i} className={`absolute ${pos} w-3 h-3 bg-blue-500 border border-white rounded-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none`}
                                style={{ transform: `translate(${pos.includes('right') ? '50%' : '-50%'}, ${pos.includes('bottom') ? '50%' : '-50%'})` }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <p className="text-xs text-gray-400">Draw on the image with your finger or mouse to define the printable area.</p>

                {/* Coordinate inputs */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'X %', key: 'printable_area_x' },
                    { label: 'Y %', key: 'printable_area_y' },
                    { label: 'Width %', key: 'printable_area_width' },
                    { label: 'Height %', key: 'printable_area_height' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-gray-500">{field.label}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={(tpl as any)[field.key]}
                        onChange={(e) => handleUpdateTemplate(tpl.id, {
                          [field.key]: parseFloat(e.target.value) || 0,
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Physical dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Print Width (inches)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="1"
                      value={tpl.physical_width_inches}
                      onChange={(e) => handleUpdateTemplate(tpl.id, {
                        physical_width_inches: parseFloat(e.target.value) || 12,
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Print Height (inches)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="1"
                      value={tpl.physical_height_inches}
                      onChange={(e) => handleUpdateTemplate(tpl.id, {
                        physical_height_inches: parseFloat(e.target.value) || 14,
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Required resolution at 300 DPI: {Math.ceil(tpl.physical_width_inches * 300)} × {Math.ceil(tpl.physical_height_inches * 300)} px
                </p>
              </div>
            ))}

            {/* Add new template */}
            <div className="card p-4 border-dashed border-2 border-gray-300">
              <h3 className="font-medium text-gray-700 mb-3">Add Template</h3>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Color Name</label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="e.g. White, Navy, Black"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadTemplate(file)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || !newColorName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Text Constraints ─── */}
        {activeSection === 'text' && (
          <div className="card p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Max Characters</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={settings.max_characters}
                  onChange={(e) => setSettings({ ...settings, max_characters: parseInt(e.target.value) || 100 })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Max Text Lines</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.max_lines}
                  onChange={(e) => setSettings({ ...settings, max_lines: parseInt(e.target.value) || 5 })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="form-label mb-2">Available Fonts</label>
              <div className="grid grid-cols-2 gap-1">
                {DEFAULT_FONTS.map(font => (
                  <label key={font} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.available_fonts.includes(font)}
                      onChange={() => toggleFont(font)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span style={{ fontFamily: font }}>{font}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label mb-2">Available Text Colors</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      settings.available_colors.includes(color) ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-300 opacity-40'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Text Settings'}
            </button>
          </div>
        )}

        {/* ─── Pricing ─── */}
        {activeSection === 'pricing' && (
          <div className="card p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Set fees charged to the customer for customization. All fees default to $0 (no extra charge).
            </p>

            {[
              { key: 'base_fee', label: 'Base Customization Fee', desc: 'Flat fee when any customization is applied' },
              { key: 'per_text_element_fee', label: 'Per Text Element Fee', desc: 'Additional charge per text element added' },
              { key: 'per_image_fee', label: 'Per Image Fee', desc: 'Additional charge per uploaded or catalog image' },
              { key: 'ai_generation_fee', label: 'AI Generation Fee', desc: 'Charge per AI image generation (coming soon)', disabled: true },
              { key: 'ai_upscaling_fee', label: 'AI Upscaling Fee', desc: 'Charge for image enhancement (coming soon)', disabled: true },
              { key: 'style_transfer_fee', label: 'Style Transfer Fee', desc: 'Charge per style transfer (coming soon)', disabled: true },
            ].map(field => (
              <div key={field.key} className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-800">{field.label}</label>
                  <p className="text-xs text-gray-500">{field.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(settings as any)[field.key]}
                    onChange={(e) => setSettings({ ...settings, [field.key]: parseFloat(e.target.value) || 0 })}
                    disabled={(field as any).disabled}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right disabled:opacity-50"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="btn-primary mt-4"
            >
              {saving ? 'Saving...' : 'Save Pricing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
