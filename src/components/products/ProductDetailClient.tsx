'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProductWithOptions, Category } from '@/lib/products'
import PricingDisplay from './PricingDisplay'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { PhotoIcon, ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { SwipeableGallery } from '@/components/mobile/TouchGestures'
import { getDeviceInfo } from '@/lib/mobile-detection'
import { getDesignsByProduct, getProductSettings } from '@/lib/designs'
import { trackViewItem } from '@/lib/analytics'
import { CustomizationModal, type DesignSpecification } from '@/modules/customization'

interface ProductDetailClientProps {
  product: ProductWithOptions
  category: Category
}

// Design data and product settings are now imported from @/lib/designs

// Color mapping function
const getColorHex = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Red': '#DC2626',
    'Blue': '#2563EB',
    'Green': '#16A34A',
    'Yellow': '#EAB308',
    'Orange': '#EA580C',
    'Purple': '#9333EA',
    'Pink': '#EC4899',
    'Gray': '#6B7280',
    'Grey': '#6B7280',
    'Navy': '#1E3A8A',
    'Brown': '#92400E',
    'Maroon': '#7F1D1D',
    'Lime': '#84CC16',
    'Teal': '#0D9488',
    'Indigo': '#4F46E5',
    'Coral': '#FF6B6B',
    'Beige': '#F5F5DC',
    'Khaki': '#C3B091',
    // Add more colors as needed
  }
  
  return colorMap[colorName] || '#9CA3AF' // Default to gray if color not found
}

export default function ProductDetailClient({ product, category }: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [priceData, setPriceData] = useState({
    pricePerUnit: 0,
    totalPrice: 0,
    tierName: '',
    discountPercentage: 0
  })
  const [selectedDesign, setSelectedDesign] = useState('')
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showCustomizationModal, setShowCustomizationModal] = useState(false)
  const [cartToast, setCartToast] = useState<string | null>(null)

  const showCartToast = useCallback((msg: string) => {
    setCartToast(msg)
    setTimeout(() => setCartToast(null), 3000)
  }, [])
  
  const { addItem, updateItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  
  // Detect mobile device
  useEffect(() => {
    const deviceInfo = getDeviceInfo()
    setIsMobile(deviceInfo.isMobile || deviceInfo.isTablet)
  }, [])

  // Track product view for analytics
  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      item_category: category.name,
      price: product.base_price
    })
  }, [product.id, product.name, category.name, product.base_price])

  // Check for design editing mode on mount
  useEffect(() => {
    const editDataString = sessionStorage.getItem('crystal-harbor-edit-design')
    if (editDataString) {
      try {
        const editData = JSON.parse(editDataString)
        if (editData.isEditing && editData.customizationData && editData.customizationData.productId === product.id) {
          // Set the product configuration to match the existing design
          setSelectedSize(editData.customizationData.selectedSize || '')
          setSelectedColor(editData.customizationData.selectedColor || '')
          
          // Open the customization modal with pre-loaded design
          setShowCustomizationModal(true)
          
          console.log('Editing mode detected, opening customization modal with design:', editData.customizationData)
        }
      } catch (error) {
        console.error('Error parsing edit design data:', error)
        // Clear invalid data
        sessionStorage.removeItem('crystal-harbor-edit-design')
      }
    }
  }, [product.id])
  
  // Get available designs and product settings
  const availableDesigns = getDesignsByProduct(product.slug)
  const productSettings = getProductSettings(product.slug)

  // Calculate total price adjustment from selected custom options
  // custom_options format from API: { "Type": { description: "...", values: [...] } } or legacy { "Type": [...] }
  const rawCustomOptions = product.custom_options || {}
  const customOptions: Record<string, { description: string; options: Array<{ id: string; option_value: string; price_adjustment: number }> }> = {}
  for (const [type, data] of Object.entries(rawCustomOptions)) {
    if (Array.isArray(data)) {
      customOptions[type] = { description: '', options: data }
    } else {
      customOptions[type] = { description: (data as any).description || '', options: (data as any).values || [] }
    }
  }
  
  const optionPriceAdjustment = Object.entries(selectedCustomOptions).reduce((total, [type, value]) => {
    const group = customOptions[type]
    if (!group) return total
    const selected = group.options.find(o => o.option_value === value)
    return total + (selected?.price_adjustment || 0)
  }, 0)
  
  // Mock product gallery images - in production these would come from the database
  const productGalleryImages = [
    product.image_url,
    `/images/products/${product.slug}-alt1.jpg`,
    `/images/products/${product.slug}-alt2.jpg`,
    `/images/products/${product.slug}-alt3.jpg`,
  ].filter((img): img is string => Boolean(img)) // Remove any null/undefined images

  const handleCustomizationAddToCart = (designSpec: DesignSpecification) => {
    const adjustedUnitPrice = priceData.pricePerUnit + optionPriceAdjustment
    
    // Check if we're in editing mode
    const editDataString = sessionStorage.getItem('crystal-harbor-edit-design')
    let isEditing = false
    let cartItemId = null
    
    if (editDataString) {
      try {
        const editData = JSON.parse(editDataString)
        if (editData.isEditing && editData.cartItemId) {
          isEditing = true
          cartItemId = editData.cartItemId
        }
      } catch (error) {
        console.error('Error parsing edit design data:', error)
      }
    }
    
    if (isEditing && cartItemId) {
      // Update existing cart item
      const updates = {
        selected_size: selectedSize,
        selected_color: selectedColor,
        selected_custom_options: Object.keys(selectedCustomOptions).length > 0 ? selectedCustomOptions : null,
        option_price_adjustment: optionPriceAdjustment,
        quantity,
        unit_price: adjustedUnitPrice,
        customization_fee: designSpec.fees.total,
        customization_data: designSpec,
        // line_total will be recalculated automatically by updateItem
      }
      
      updateItem(cartItemId, updates)
      
      // Clear editing data
      sessionStorage.removeItem('crystal-harbor-edit-design')
      
      setShowCustomizationModal(false)
      
      // Show success message and redirect to cart
      showCartToast(`Updated your customized ${product.name}!`)
      window.location.href = '/cart'
    } else {
      // Add new cart item (existing behavior)
      const cartItem = {
        id: `${product.id}-${selectedSize}-${selectedColor}-custom-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        category_slug: category.slug,
        selected_size: selectedSize,
        selected_color: selectedColor,
        selected_custom_options: Object.keys(selectedCustomOptions).length > 0 ? selectedCustomOptions : null,
        option_price_adjustment: optionPriceAdjustment,
        quantity,
        unit_price: adjustedUnitPrice,
        customization_fee: designSpec.fees.total,
        line_total: (adjustedUnitPrice + designSpec.fees.total) * quantity,
        tier_applied: priceData.tierName,
        uploaded_file: null,
        custom_text: null,
        selected_design: null,
        customization_data: designSpec,
        image_url: product.image_url,
      }

      addItem(cartItem)
      setShowCustomizationModal(false)
      
      // Show success message
      showCartToast(`Added customized ${product.name} to cart!`)
    }
  }

  const handleAddToCart = () => {
    setError('')

    // Validate required selections
    if (product.sizes.length > 0 && !selectedSize) {
      setError('Please select a size')
      return
    }

    if (product.colors.length > 0 && !selectedColor) {
      setError('Please select a color')
      return
    }

    // Validate custom options — each type requires a selection
    for (const [type, group] of Object.entries(customOptions)) {
      if (group.options.length > 0 && !selectedCustomOptions[type]) {
        setError(`Please select a ${type}`)
        return
      }
    }

    // Calculate adjusted unit price (base tier price + option adjustments)
    const adjustedUnitPrice = priceData.pricePerUnit + optionPriceAdjustment
    const adjustedTotal = adjustedUnitPrice * quantity

    // Get selected design info
    const selectedDesignInfo = selectedDesign ? availableDesigns.find(d => d.id === selectedDesign) : null

    // Create cart item
    const cartItem = {
      id: `${product.id}-${selectedSize}-${selectedColor}-${selectedDesign}-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      category_slug: category.slug,
      selected_size: selectedSize,
      selected_color: selectedColor,
      selected_custom_options: Object.keys(selectedCustomOptions).length > 0 ? selectedCustomOptions : null,
      option_price_adjustment: optionPriceAdjustment,
      quantity,
      unit_price: adjustedUnitPrice,
      customization_fee: 0,
      line_total: adjustedTotal,
      tier_applied: priceData.tierName,
      uploaded_file: null,
      custom_text: null,
      selected_design: selectedDesignInfo ? {
        id: selectedDesignInfo.id,
        name: selectedDesignInfo.name,
        description: selectedDesignInfo.description,
        imageUrl: selectedDesignInfo.imageUrl
      } : null,
      customization_data: null,
      image_url: product.image_url,
    }

    addItem(cartItem)

    showCartToast(`Added ${quantity} ${product.name} to cart!`)
  }

  return (
    <>
      {/* Cart toast notification */}
      {cartToast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <ShoppingCartIcon className="w-5 h-5" />
          <span className="font-medium">{cartToast}</span>
        </div>
      )}
    <div className="section-padding bg-white">
      <div className="container mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <Link href={`/products/${category.slug}`} className="hover:text-primary-600">
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {isMobile && productGalleryImages.length > 1 ? (
              /* Mobile: Swipeable Gallery */
              <SwipeableGallery
                images={productGalleryImages}
                alt={product.name}
                className="aspect-square rounded-lg overflow-hidden"
              />
            ) : (
              /* Desktop: Traditional Layout */
              <>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
                      <div className="text-center">
                        <div className="text-secondary-400 text-6xl mb-4">📷</div>
                        <p className="text-secondary-500">Upload your design below</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop thumbnail grid */}
                {productGalleryImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {productGalleryImages.slice(1, 5).map((imageUrl, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={`${product.name} view ${i + 2}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            // Fallback to placeholder if image doesn't exist
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex')
                          }}
                        />
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center hidden">
                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <span className="inline-block bg-accent-lime-100 text-accent-lime-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                {category.name}
              </span>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-primary-600 mb-4">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-lg text-secondary-600">{product.description}</p>
              )}
              {product.material && (
                <p className="text-sm text-secondary-500 mt-2">
                  Material: <span className="font-semibold">{product.material}</span>
                </p>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Size *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size.option_value)}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        selectedSize === size.option_value
                          ? 'border-accent-coral-500 bg-accent-coral-50 text-accent-coral-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:text-gray-900'
                      }`}
                    >
                      {size.option_value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Color *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color.option_value)}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 ${
                        selectedColor === color.option_value
                          ? 'border-accent-lime-500 bg-accent-lime-50'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full border-2 mb-2 ${
                          color.option_value.toLowerCase() === 'white' ? 'border-gray-300' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: getColorHex(color.option_value) }}
                      />
                      <span className={`text-xs font-medium text-center ${
                        selectedColor === color.option_value
                          ? 'text-accent-lime-700'
                          : 'text-gray-800'
                      }`}>
                        {color.option_value}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Options (dynamic) */}
            {Object.entries(customOptions).map(([type, group]) => (
              group.options.length > 0 && (
                <div key={type}>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    {type} *
                  </label>
                  {group.description && (
                    <p className="text-sm text-secondary-500 mb-2">{group.description}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.options.map((option) => (
                      <button
                        key={option.id || option.option_value}
                        type="button"
                        onClick={() => setSelectedCustomOptions(prev => ({ ...prev, [type]: option.option_value }))}
                        className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                          selectedCustomOptions[type] === option.option_value
                            ? 'border-accent-coral-500 bg-accent-coral-50 text-accent-coral-700'
                            : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:text-gray-900'
                        }`}
                      >
                        <span>{option.option_value}</span>
                        {option.price_adjustment !== 0 && (
                          <span className="block text-xs mt-1 text-secondary-500">
                            {option.price_adjustment > 0 ? '+' : ''}${option.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}

            {/* Pre-selected Design Catalog */}
            {availableDesigns.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display font-semibold text-lg text-primary-600 mb-2">
                    Design Options
                  </h3>
                  <p className="text-sm text-secondary-600 mb-4">
                    {productSettings.instructions}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    Choose a Design
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableDesigns.map((design) => (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => {
                          setSelectedDesign(design.id)
                          setError('')
                        }}
                        className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedDesign === design.id
                            ? 'border-accent-coral-500 bg-accent-coral-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                          {design.imageUrl ? (
                            <img
                              src={design.imageUrl}
                              alt={design.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex')
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full items-center justify-center hidden">
                            <span className="text-2xl">🎨</span>
                          </div>
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium text-neutral-700">{design.name}</div>
                          <div className="text-secondary-500 mt-1">{design.description}</div>
                        </div>
                        {selectedDesign === design.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-coral-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedDesign && (
                    <div className="mt-3 p-3 bg-accent-coral-50 rounded-lg">
                      <span className="text-sm font-medium text-accent-coral-700">
                        Selected: {availableDesigns.find(d => d.id === selectedDesign)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customization hint for customizable products */}
            {product.is_customizable && (
              <div className="bg-accent-coral-50 border border-accent-coral-200 rounded-lg p-4">
                <p className="text-sm text-accent-coral-700 font-medium">
                  🎨 Want to personalize further? Use the "Customize This Product" button below to add your own text, images, or designs.
                </p>
              </div>
            )}

            {/* Pricing */}
            <PricingDisplay
              pricingTiers={product.pricing_tiers}
              basePrice={product.base_price}
              onPriceChange={setPriceData}
              onQuantityChange={setQuantity}
            />

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Add to Cart Buttons */}
            <div className="space-y-3">
              {/* Standard Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full text-lg py-4"
              >
                Add to Cart - ${(priceData.totalPrice + optionPriceAdjustment * quantity).toFixed(2)}
              </button>

              {/* Customization Button - only show for customizable products */}
              {product.is_customizable && (<button
                onClick={() => {
                  // Validate required selections first
                  if (!isAuthenticated) {
                    // Require login for customization
                    sessionStorage.setItem('crystal-harbor-redirect-after-login', window.location.pathname)
                    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}&reason=customization`
                    return
                  }
                  if (product.sizes.length > 0 && !selectedSize) {
                    setError('Please select a size first')
                    return
                  }
                  if (product.colors.length > 0 && !selectedColor) {
                    setError('Please select a color first')
                    return
                  }
                  setError('')
                  setShowCustomizationModal(true)
                }}
                className="btn-outline w-full text-lg py-4 flex items-center justify-center space-x-2 border-2 border-accent-coral-300 text-accent-coral-600 hover:bg-accent-coral-50"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Customize This Product</span>
              </button>)}
            </div>

            {/* Go to Cart Link */}
            <div className="text-center">
              <Link 
                href="/cart"
                className="inline-flex items-center space-x-2 text-accent-coral-500 hover:text-accent-coral-600 font-medium transition-colors duration-200"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                <span>Go to Cart</span>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="bg-background-50 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-neutral-700 mb-2">What happens next?</h4>
              <ul className="space-y-1 text-secondary-600">
                <li>• Your order will be reviewed and prepared for printing</li>
                <li>• Professional printing on high-quality materials</li>
                <li>• Carefully packaged and shipped to your address</li>
                <li>• Typical delivery: 2-3 weeks for custom items</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Customization Modal - only render for customizable products */}
        {product.is_customizable && (<CustomizationModal
          productId={product.id}
          productName={product.name}
          basePrice={priceData.pricePerUnit + optionPriceAdjustment}
          isOpen={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          onAddToCart={handleCustomizationAddToCart}
        />)}
      </div>
    </div>
    </>
  )
}