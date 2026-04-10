import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackAddToCart } from '@/lib/analytics'
import type { DesignSpecification } from '@/modules/customization'

export interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  category_slug: string
  selected_size: string
  selected_color: string
  quantity: number
  unit_price: number
  customization_fee: number
  line_total: number
  tier_applied: string
  uploaded_file: File | null
  custom_text: string | null
  selected_design: {
    id: string
    name: string
    description: string
    imageUrl: string
  } | null
  customization_data: DesignSpecification | null
  image_url: string | null
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  
  // Computed values (reactive)
  totalItems: number
  subtotal: number
  
  // Actions
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

// Helper functions to calculate totals
const calculateTotalItems = (items: CartItem[]) => {
  return items.reduce((total, item) => total + item.quantity, 0)
}

const calculateSubtotal = (items: CartItem[]) => {
  return items.reduce((total, item) => total + item.line_total, 0)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      subtotal: 0,

      addItem: (newItem) => {
        set((state) => {
          // Check if similar item already exists (same product, size, color, customization)
          // Customized items are always unique - never merge
          const existingItemIndex = !newItem.customization_data && state.items.findIndex(
            (item) =>
              item.product_id === newItem.product_id &&
              item.selected_size === newItem.selected_size &&
              item.selected_color === newItem.selected_color &&
              item.custom_text === newItem.custom_text &&
              !item.customization_data &&
              // For uploaded files, we treat each as unique since files can't be easily compared
              !newItem.uploaded_file
          )

          let updatedItems
          if (existingItemIndex !== false && existingItemIndex > -1 && !newItem.uploaded_file && !newItem.customization_data) {
            // Update existing item quantity and recalculate price
            const existingItem = state.items[existingItemIndex]
            const newQuantity = existingItem.quantity + newItem.quantity
            const newLineTotal = (newItem.unit_price + newItem.customization_fee) * newQuantity

            updatedItems = [...state.items]
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              line_total: newLineTotal,
            }
          } else {
            // Add as new item - calculate line total including customization fee
            const itemWithCalculatedTotal = {
              ...newItem,
              line_total: (newItem.unit_price + newItem.customization_fee) * newItem.quantity
            }
            updatedItems = [...state.items, itemWithCalculatedTotal]
          }

          // Calculate updated totals
          const newTotalItems = calculateTotalItems(updatedItems)
          const newSubtotal = calculateSubtotal(updatedItems)

          // Trigger cart update event for header
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cartUpdated'))
          }

          // Track add to cart event in Google Analytics
          trackAddToCart({
            item_id: newItem.product_id,
            item_name: newItem.product_name,
            item_category: newItem.category_slug,
            quantity: newItem.quantity,
            price: newItem.unit_price
          })

          return { 
            items: updatedItems,
            totalItems: newTotalItems,
            subtotal: newSubtotal
          }
        })
      },

      removeItem: (itemId) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== itemId)
          
          // Calculate updated totals
          const newTotalItems = calculateTotalItems(updatedItems)
          const newSubtotal = calculateSubtotal(updatedItems)
          
          // Trigger cart update event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cartUpdated'))
          }

          return { 
            items: updatedItems,
            totalItems: newTotalItems,
            subtotal: newSubtotal
          }
        })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set((state) => {
          const updatedItems = state.items.map((item) => {
            if (item.id === itemId) {
              const newLineTotal = (item.unit_price + item.customization_fee) * quantity
              return {
                ...item,
                quantity,
                line_total: newLineTotal,
              }
            }
            return item
          })

          // Calculate updated totals
          const newTotalItems = calculateTotalItems(updatedItems)
          const newSubtotal = calculateSubtotal(updatedItems)

          // Trigger cart update event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cartUpdated'))
          }

          return { 
            items: updatedItems,
            totalItems: newTotalItems,
            subtotal: newSubtotal
          }
        })
      },

      clearCart: () => {
        set({ 
          items: [],
          totalItems: 0,
          subtotal: 0
        })
        
        // Trigger cart update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated'))
        }
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items.map(item => ({
          ...item,
          uploaded_file: null // Don't persist files, they'll need to be re-uploaded
        }))
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate totals when hydrating from localStorage
          state.totalItems = calculateTotalItems(state.items)
          state.subtotal = calculateSubtotal(state.items)
        }
      }
    }
  )
)