'use client'

import { useState } from 'react'
import type { CatalogDesign, CustomizationPricing } from '../types'

interface CatalogDesignPickerProps {
  designs: CatalogDesign[]
  pricing: CustomizationPricing
  onSelectDesign: (design: CatalogDesign) => void
}

export function CatalogDesignPicker({ designs, pricing, onSelectDesign }: CatalogDesignPickerProps) {
  const [search, setSearch] = useState('')

  // Group by category
  const categories = Array.from(new Set(designs.map(d => d.category)))
  const filtered = designs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        🎨 Catalog Designs
        {pricing.perImageFee > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            +${pricing.perImageFee.toFixed(2)}/design
          </span>
        )}
      </h4>

      {designs.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No catalog designs available for this product.</p>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designs..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
          />

          <div className="max-h-64 overflow-y-auto space-y-3">
            {categories
              .filter(cat => filtered.some(d => d.category === cat))
              .map(cat => (
              <div key={cat}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{cat}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {filtered.filter(d => d.category === cat).map(design => (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => onSelectDesign(design)}
                      className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors aspect-square"
                    >
                      <img
                        src={design.thumbnailUrl}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                        <p className="text-[10px] text-white truncate">{design.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
