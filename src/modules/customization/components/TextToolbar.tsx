'use client'

import { useState } from 'react'
import type { TextConstraints, CustomizationPricing } from '../types'

interface TextToolbarProps {
  constraints: TextConstraints
  pricing: CustomizationPricing
  selectedText: {
    fontFamily?: string
    fontSize?: number
    fill?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  } | null
  onAddText: (text: string, font: string, size: number, color: string) => void
  onUpdateText: (props: {
    fontFamily?: string
    fontSize?: number
    fontColor?: string
    bold?: boolean
    italic?: boolean
    alignment?: 'left' | 'center' | 'right'
  }) => void
}

export function TextToolbar({ constraints, pricing, selectedText, onAddText, onUpdateText }: TextToolbarProps) {
  const [inputText, setInputText] = useState('')
  const [font, setFont] = useState(constraints.availableFonts[0] || 'Arial')
  const [fontSize, setFontSize] = useState(32)
  const [color, setColor] = useState(constraints.availableColors[0] || '#000000')

  const handleAdd = () => {
    if (!inputText.trim()) return
    if (inputText.length > constraints.maxCharacters) return
    onAddText(inputText.trim(), font, fontSize, color)
    setInputText('')
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        ✏️ Add Text
        {pricing.perTextElementFee > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            +${pricing.perTextElementFee.toFixed(2)}/element
          </span>
        )}
      </h4>

      <div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            if (e.target.value.length <= constraints.maxCharacters) {
              setInputText(e.target.value)
            }
          }}
          placeholder="Type your text here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">
            {inputText.length}/{constraints.maxCharacters} characters
          </span>
          <span className="text-xs text-gray-400">
            Max {constraints.maxLines} lines
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Font</label>
          <select
            value={selectedText?.fontFamily || font}
            onChange={(e) => {
              setFont(e.target.value)
              if (selectedText) onUpdateText({ fontFamily: e.target.value })
            }}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            {constraints.availableFonts.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Size</label>
          <input
            type="range"
            min={12}
            max={120}
            value={selectedText?.fontSize || fontSize}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              setFontSize(val)
              if (selectedText) onUpdateText({ fontSize: val })
            }}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{selectedText?.fontSize || fontSize}px</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {constraints.availableColors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c)
                if (selectedText) onUpdateText({ fontColor: c })
              }}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                (selectedText?.fill || color) === c ? 'border-blue-500 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Style toggles - only when text is selected */}
      {selectedText && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateText({ bold: selectedText.fontWeight !== 'bold' })}
            className={`px-3 py-1 text-sm font-bold rounded border ${
              selectedText.fontWeight === 'bold' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onUpdateText({ italic: selectedText.fontStyle !== 'italic' })}
            className={`px-3 py-1 text-sm italic rounded border ${
              selectedText.fontStyle === 'italic' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            I
          </button>
          <div className="flex border border-gray-300 rounded overflow-hidden ml-auto">
            {(['left', 'center', 'right'] as const).map(align => (
              <button
                key={align}
                type="button"
                onClick={() => onUpdateText({ alignment: align })}
                className={`px-2 py-1 text-xs ${
                  selectedText.textAlign === align ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                {align === 'left' ? '⫷' : align === 'center' ? '☰' : '⫸'}
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedText && inputText.trim() && (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add Text to Design
        </button>
      )}
    </div>
  )
}
