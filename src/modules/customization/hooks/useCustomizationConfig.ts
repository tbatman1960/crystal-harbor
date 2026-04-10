import { useState, useEffect } from 'react'
import type { ProductCustomizationConfig, CatalogDesign } from '../types'

interface UseCustomizationConfigResult {
  config: ProductCustomizationConfig | null
  catalogDesigns: CatalogDesign[]
  permissions: {
    allowText: boolean
    allowImageUpload: boolean
    allowCatalogDesigns: boolean
    allowAiGeneration: boolean
    allowStyleTransfer: boolean
  } | null
  loading: boolean
  error: string | null
}

export function useCustomizationConfig(productId: string): UseCustomizationConfigResult {
  const [config, setConfig] = useState<ProductCustomizationConfig | null>(null)
  const [catalogDesigns, setCatalogDesigns] = useState<CatalogDesign[]>([])
  const [permissions, setPermissions] = useState<UseCustomizationConfigResult['permissions']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return

    const fetchConfig = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/customization/config?product_id=${productId}`)
        if (!res.ok) {
          setError('Failed to load customization config')
          return
        }
        const data = await res.json()

        setConfig({
          productId,
          templates: data.templates,
          textConstraints: data.textConstraints,
          pricing: data.pricing,
        })
        setCatalogDesigns(data.catalogDesigns || [])
        setPermissions(data.permissions)
      } catch (err) {
        console.error('Error loading customization config:', err)
        setError('Failed to load customization options')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [productId])

  return { config, catalogDesigns, permissions, loading, error }
}
