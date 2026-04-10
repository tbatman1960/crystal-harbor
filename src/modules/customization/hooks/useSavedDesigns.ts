'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { DesignSpecification } from '../types'

interface SavedDesign {
  id: string
  design_name: string
  preview_image_url: string | null
  product_id: string
  created_at: string
  updated_at: string
}

interface SavedDesignDetail extends SavedDesign {
  design_data: DesignSpecification
}

interface GuestDesign {
  id: string
  design_name: string
  design_data: DesignSpecification
  preview_image_url: string | null
  product_id: string
  created_at: string
}

export function useSavedDesigns(productId: string) {
  const { user, isAuthenticated } = useAuthStore()
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved designs on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadSavedDesigns()
    } else {
      // Load guest designs from sessionStorage
      loadGuestDesigns()
    }
  }, [isAuthenticated, user?.id, productId])

  // Load customer saved designs from API
  const loadSavedDesigns = async () => {
    if (!isAuthenticated || !user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/account/designs?customer_id=${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load saved designs')
      }

      // Filter designs for this product
      const productDesigns = data.designs.filter((d: SavedDesign) => d.product_id === productId)
      setSavedDesigns(productDesigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved designs')
    } finally {
      setLoading(false)
    }
  }

  // Load guest designs from sessionStorage
  const loadGuestDesigns = () => {
    try {
      const saved = sessionStorage.getItem('crystal-harbor-guest-designs')
      if (saved) {
        const guestDesigns: GuestDesign[] = JSON.parse(saved)
        const productDesigns = guestDesigns
          .filter(d => d.product_id === productId)
          .map(d => ({
            id: d.id,
            design_name: d.design_name,
            preview_image_url: d.preview_image_url,
            product_id: d.product_id,
            created_at: d.created_at,
            updated_at: d.created_at
          }))
        setSavedDesigns(productDesigns)
      } else {
        setSavedDesigns([])
      }
    } catch {
      setSavedDesigns([])
    }
  }

  // Save a new design
  const saveDesign = async (
    designData: DesignSpecification,
    designName: string,
    previewImageUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isAuthenticated && user?.id) {
      // Save to database for authenticated users
      try {
        const response = await fetch('/api/account/designs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: user.id,
            product_id: productId,
            design_name: designName,
            design_data: designData,
            preview_image_url: previewImageUrl
          })
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to save design' }
        }

        // Refresh the list
        await loadSavedDesigns()
        
        return { success: true }
      } catch (err) {
        return { 
          success: false, 
          error: err instanceof Error ? err.message : 'Failed to save design' 
        }
      }
    } else {
      // Save to sessionStorage for guests
      try {
        const guestDesign: GuestDesign = {
          id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          design_name: designName,
          design_data: designData,
          preview_image_url: previewImageUrl || null,
          product_id: productId,
          created_at: new Date().toISOString()
        }

        const saved = sessionStorage.getItem('crystal-harbor-guest-designs')
        const guestDesigns: GuestDesign[] = saved ? JSON.parse(saved) : []
        guestDesigns.push(guestDesign)
        
        // Keep only the last 10 guest designs to avoid storage limits
        if (guestDesigns.length > 10) {
          guestDesigns.splice(0, guestDesigns.length - 10)
        }

        sessionStorage.setItem('crystal-harbor-guest-designs', JSON.stringify(guestDesigns))
        loadGuestDesigns() // Refresh the list
        
        return { success: true }
      } catch {
        return { success: false, error: 'Failed to save design locally' }
      }
    }
  }

  // Load a specific design
  const loadDesign = async (designId: string): Promise<{ 
    design?: DesignSpecification; 
    error?: string 
  }> => {
    if (isAuthenticated && user?.id && !designId.startsWith('guest-')) {
      // Load from database
      try {
        const response = await fetch(`/api/account/designs/${designId}?customer_id=${user.id}`)
        const data = await response.json()

        if (!response.ok) {
          return { error: data.error || 'Failed to load design' }
        }

        return { design: data.design.design_data }
      } catch (err) {
        return { 
          error: err instanceof Error ? err.message : 'Failed to load design' 
        }
      }
    } else {
      // Load from sessionStorage for guests
      try {
        const saved = sessionStorage.getItem('crystal-harbor-guest-designs')
        if (saved) {
          const guestDesigns: GuestDesign[] = JSON.parse(saved)
          const design = guestDesigns.find(d => d.id === designId)
          if (design) {
            return { design: design.design_data }
          }
        }
        return { error: 'Design not found' }
      } catch {
        return { error: 'Failed to load design' }
      }
    }
  }

  // Delete a design
  const deleteDesign = async (designId: string): Promise<{ success: boolean; error?: string }> => {
    if (isAuthenticated && user?.id && !designId.startsWith('guest-')) {
      // Delete from database
      try {
        const response = await fetch(`/api/account/designs?design_id=${designId}&customer_id=${user.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to delete design' }
        }

        // Refresh the list
        await loadSavedDesigns()
        
        return { success: true }
      } catch (err) {
        return { 
          success: false, 
          error: err instanceof Error ? err.message : 'Failed to delete design' 
        }
      }
    } else {
      // Delete from sessionStorage for guests
      try {
        const saved = sessionStorage.getItem('crystal-harbor-guest-designs')
        if (saved) {
          const guestDesigns: GuestDesign[] = JSON.parse(saved)
          const filtered = guestDesigns.filter(d => d.id !== designId)
          sessionStorage.setItem('crystal-harbor-guest-designs', JSON.stringify(filtered))
          loadGuestDesigns() // Refresh the list
        }
        return { success: true }
      } catch {
        return { success: false, error: 'Failed to delete design locally' }
      }
    }
  }

  return {
    savedDesigns,
    loading,
    error,
    saveDesign,
    loadDesign,
    deleteDesign,
    refreshDesigns: isAuthenticated ? loadSavedDesigns : loadGuestDesigns,
    isGuest: !isAuthenticated
  }
}