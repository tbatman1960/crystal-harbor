'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type {
  ProductCustomizationConfig,
  CatalogDesign,
  DesignLayer,
  DesignSpecification,
  LowResWarning,
} from '../types'
import { v4 as uuidv4 } from 'uuid'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useCanvasEditor } from '../hooks/useCanvasEditor'
import { calculateFees } from '../utils/pricing'
import { TextToolbar } from './TextToolbar'
import { ImageUploader } from './ImageUploader'
import { CatalogDesignPicker } from './CatalogDesignPicker'
import { LayerPanel } from './LayerPanel'
import { FeeDisplay } from './FeeDisplay'

interface CustomizationEditorProps {
  productId: string
  productName: string
  basePrice: number
  config: ProductCustomizationConfig
  catalogDesigns: CatalogDesign[]
  allowText: boolean
  allowImageUpload: boolean
  allowCatalogDesigns: boolean
  allowAiGeneration: boolean
  allowStyleTransfer: boolean
  onAddToCart: (spec: DesignSpecification) => void
  onCancel: () => void
}

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 600

type ToolTab = 'text' | 'image' | 'catalog' | 'layers'

export function CustomizationEditor({
  productId,
  productName,
  basePrice,
  config,
  catalogDesigns,
  allowText,
  allowImageUpload,
  allowCatalogDesigns,
  onAddToCart,
  onCancel,
}: CustomizationEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState<ToolTab>(
    allowText ? 'text' : allowImageUpload ? 'image' : 'catalog'
  )
  const [selectedColor, setSelectedColor] = useState(
    config.templates[0]?.colorName || ''
  )
  const [showPreview, setShowPreview] = useState(false)
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('')
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set())

  const currentTemplate = config.templates.find(t => t.colorName === selectedColor) || config.templates[0]

  // Undo/redo on layer snapshots
  const {
    current: layers,
    set: setLayers,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useUndoRedo<DesignLayer[]>([])

  const handleLayersChange = useCallback((newLayers: DesignLayer[]) => {
    setLayers(newLayers)
  }, [setLayers])

  const editor = useCanvasEditor({
    printableArea: currentTemplate?.printableArea || { x: 25, y: 20, width: 50, height: 50 },
    physicalDimensions: currentTemplate?.physicalDimensions || { widthInches: 12, heightInches: 14 },
    templateImageUrl: currentTemplate?.imageUrl || '',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    onLayersChange: handleLayersChange,
  })

  // Init canvas on mount
  useEffect(() => {
    if (canvasElRef.current && currentTemplate) {
      editor.initCanvas(canvasElRef.current)
    }
    return () => editor.dispose()
  }, [currentTemplate?.id])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not typing in an input
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          editor.removeSelected()
        }
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [undo, redo, editor.removeSelected])

  const selectedObj = editor.getSelectedObject()

  const handlePreview = () => {
    const dataUrl = editor.exportPreview(1.0)
    setPreviewDataUrl(dataUrl)
    setShowPreview(true)
  }

  const handleClear = () => {
    if (!confirm('Are you sure? This will remove all your design work.')) return
    editor.clearAll()
  }

  const handleToggleVisibility = (layerId: string) => {
    editor.toggleLayerVisibility(layerId)
    setHiddenLayerIds(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
  }

  const handleAddToCart = () => {
    const preview = editor.exportPreview()
    const fees = calculateFees(layers, config.pricing)

    // Build low-res warnings
    const lowResWarnings: LowResWarning[] = layers
      .filter((l): l is import('../types').ImageLayer => l.type === 'image' && l.lowResolutionFlag)
      .map(l => ({
        layerId: l.id,
        filename: l.originalFilename,
        currentDpi: l.dpiAtCurrentSize,
        recommendedDpi: 300,
        message: 'This image may not print clearly at this size.',
      }))

    const spec: DesignSpecification = {
      designId: uuidv4(),
      productId,
      templateId: currentTemplate?.id || '',
      selectedColor,
      selectedSize: null, // set by product page
      layers,
      fees: {
        baseFee: fees.baseFee,
        textFees: fees.textFees,
        imageFees: fees.imageFees,
        aiFees: 0,
        upscalingFees: 0,
        styleTransferFees: 0,
        total: fees.totalFee,
      },
      previewImageUrl: preview,
      aiPreviewImageUrl: null,
      printFileUrl: null,
      lowResWarnings,
      metadata: {
        createdAt: new Date().toISOString(),
        editorVersion: '1.0',
        canvasLibrary: 'fabric@6',
      },
    }

    // Log for development / debugging
    console.log('[Customization] Design specification:', JSON.stringify(spec, null, 2))

    onAddToCart(spec)
  }

  if (!currentTemplate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No customization templates have been set up for this product yet.</p>
        <button onClick={onCancel} className="btn-secondary">Go Back</button>
      </div>
    )
  }

  const tabs: { key: ToolTab; label: string; icon: string; show: boolean }[] = [
    { key: 'text', label: 'Text', icon: '✏️', show: allowText },
    { key: 'image', label: 'Upload', icon: '📷', show: allowImageUpload },
    { key: 'catalog', label: 'Designs', icon: '🎨', show: allowCatalogDesigns },
    { key: 'layers', label: 'Layers', icon: '📋', show: true },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-[1100px] mx-auto">
      {/* Canvas area */}
      <div className="flex-1">
        {/* Color selector */}
        {config.templates.length > 1 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">Color:</span>
            {config.templates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedColor(t.colorName)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedColor === t.colorName
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {t.colorName}
              </button>
            ))}
          </div>
        )}

        {/* Undo/redo bar */}
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
          {editor.selectedObjectId && (
            <button
              type="button"
              onClick={editor.removeSelected}
              className="ml-auto px-3 py-1 text-sm rounded border border-red-300 text-red-600 hover:bg-red-50"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        {/* Canvas */}
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white inline-block">
          <canvas ref={canvasElRef} />
        </div>

        <p className="text-xs text-gray-400 mt-1">
          Click elements to select. Drag to reposition. Use handles to resize.
        </p>
      </div>

      {/* Sidebar tools */}
      <div className="w-full lg:w-72 space-y-4">
        <div className="text-lg font-semibold text-gray-900">
          Customize: {productName}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === 'text' && allowText && (
            <TextToolbar
              constraints={config.textConstraints}
              pricing={config.pricing}
              selectedText={selectedObj?.type === 'text' ? selectedObj : null}
              onAddText={(text, font, size, color) => editor.addText(text, font, size, color)}
              onUpdateText={editor.updateTextProperties}
            />
          )}

          {activeTab === 'image' && allowImageUpload && (
            <ImageUploader
              pricing={config.pricing}
              physicalDimensions={currentTemplate.physicalDimensions}
              onAddImage={(dataUrl, filename, w, h) => editor.addImage(dataUrl, filename, w, h)}
            />
          )}

          {activeTab === 'catalog' && allowCatalogDesigns && (
            <CatalogDesignPicker
              designs={catalogDesigns}
              pricing={config.pricing}
              onSelectDesign={(d) => editor.addCatalogDesign(d.id, d.name, d.imageUrl)}
            />
          )}

          {activeTab === 'layers' && (
            <LayerPanel
              layers={layers}
              selectedLayerId={editor.selectedObjectId}
              hiddenLayerIds={hiddenLayerIds}
              onSelectLayer={(id) => {
                const canvas = (editor as any).canvasRef?.current
                if (canvas) {
                  const obj = canvas.getObjects().find((o: any) => o.layerId === id)
                  if (obj) {
                    canvas.setActiveObject(obj)
                    canvas.renderAll()
                  }
                }
              }}
              onRemoveLayer={editor.removeSelected}
              onMoveLayer={editor.moveLayer}
              onToggleVisibility={handleToggleVisibility}
            />
          )}
        </div>

        {/* Fee breakdown */}
        <FeeDisplay
          layers={layers}
          pricing={config.pricing}
          baseProductPrice={basePrice}
        />

        {/* Low-res warnings */}
        {layers.some(l => l.type === 'image' && l.lowResolutionFlag) && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            ⚠️ One or more images may not print clearly at this size. We&apos;ll offer image enhancement options soon.
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={layers.length === 0}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {layers.length === 0 ? 'Add elements to continue' : 'Add Customized Product to Cart'}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={layers.length === 0}
            className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            👁️ Preview
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={layers.length === 0}
              className="flex-1 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {/* Placeholder for future buttons */}
          <div className="flex gap-2 opacity-40 pointer-events-none">
            <button
              type="button"
              disabled
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-400"
            >
              💾 Save Design
            </button>
            <button
              type="button"
              disabled
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-400"
            >
              🔗 Share Design
            </button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Design Preview</h3>
            <img
              src={previewDataUrl}
              alt="Design preview"
              className="w-full rounded-lg border border-gray-200"
            />
            {layers.some(l => l.type === 'image' && l.lowResolutionFlag) && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Some images are low resolution and may appear blurry when printed.
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-preview.png`
                  link.href = previewDataUrl
                  link.click()
                }}
                className="flex-1 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
              >
                📥 Download Preview
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
