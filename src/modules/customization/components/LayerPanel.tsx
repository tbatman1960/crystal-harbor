'use client'

import type { DesignLayer } from '../types'

interface LayerPanelProps {
  layers: DesignLayer[]
  selectedLayerId: string | null
  hiddenLayerIds: Set<string>
  onSelectLayer: (id: string) => void
  onRemoveLayer: () => void
  onMoveLayer: (direction: 'up' | 'down') => void
  onToggleVisibility: (id: string) => void
  onEnhanceImage?: (layerId: string) => void
}

export function LayerPanel({
  layers,
  selectedLayerId,
  hiddenLayerIds,
  onSelectLayer,
  onRemoveLayer,
  onMoveLayer,
  onToggleVisibility,
  onEnhanceImage,
}: LayerPanelProps) {
  if (layers.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic text-center py-4">
        No elements added yet
      </div>
    )
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'text': return '✏️'
      case 'image': return '📷'
      case 'catalog-design': return '🎨'
      default: return '📄'
    }
  }

  const typeLabel = (layer: DesignLayer) => {
    switch (layer.type) {
      case 'text': return layer.text.substring(0, 20) || 'Text'
      case 'image': return layer.originalFilename || 'Image'
      case 'catalog-design': return layer.designName || 'Design'
      default: return 'Element'
    }
  }

  // Display in reverse order (top layer first)
  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Layers</h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMoveLayer('up')}
            disabled={!selectedLayerId}
            className="p-1 text-xs rounded border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveLayer('down')}
            disabled={!selectedLayerId}
            className="p-1 text-xs rounded border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemoveLayer}
            disabled={!selectedLayerId}
            className="p-1 text-xs rounded border border-red-300 text-red-600 disabled:opacity-30 hover:bg-red-50"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {sorted.map(layer => {
          const isImageLayer = layer.type === 'image'
          const isLowRes = isImageLayer && (layer as import('../types').ImageLayer).lowResolutionFlag
          
          return (
            <div key={layer.id}>
              <button
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-100 border border-blue-300 text-blue-800'
                    : 'bg-gray-50 border border-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id) }}
                  className="text-gray-400 hover:text-gray-700 flex-shrink-0"
                  title={hiddenLayerIds.has(layer.id) ? 'Show' : 'Hide'}
                >
                  {hiddenLayerIds.has(layer.id) ? '👁️‍🗨️' : '👁️'}
                </button>
                <span>{typeIcon(layer.type)}</span>
                <span className={`truncate flex-1 ${hiddenLayerIds.has(layer.id) ? 'opacity-40 line-through' : ''}`}>
                  {typeLabel(layer)}
                  {isLowRes && <span className="text-amber-600 ml-1">⚠️</span>}
                </span>
                {isLowRes && onEnhanceImage && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEnhanceImage(layer.id) }}
                    className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0"
                    title="Enhance image quality"
                  >
                    ✨
                  </button>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
