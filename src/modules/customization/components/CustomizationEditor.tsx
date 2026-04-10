'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type {
  ProductCustomizationConfig,
  CatalogDesign,
  DesignLayer,
  DesignSpecification,
} from '../types'
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
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
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

  const handleAddToCart = () => {
    const previewDataUrl = editor.exportPreview()
    const fees = calculateFees(layers, config.pricing)

    const spec: DesignSpecification = {
      productId,
      templateId: currentTemplate?.id || '',
      selectedColor,
      layers,
      previewImageDataUrl: previewDataUrl,
      customizationFees: fees,
    }

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
              onSelectLayer={(id) => {
                // Select the object on canvas
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
            />
          )}
        </div>

        {/* Fee breakdown */}
        <FeeDisplay
          layers={layers}
          pricing={config.pricing}
          baseProductPrice={basePrice}
        />

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
            onClick={onCancel}
            className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
