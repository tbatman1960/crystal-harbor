'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductWithOptions, Category } from '@/lib/products'
import PricingDisplay from './PricingDisplay'
import { useCartStore } from '@/store/cartStore'
import { PhotoIcon, DocumentArrowUpIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { SwipeableGallery } from '@/components/mobile/TouchGestures'
import { getDeviceInfo } from '@/lib/mobile-detection'
import { getDesignsByProduct, getProductSettings } from '@/lib/designs'
import { trackViewItem } from '@/lib/analytics'

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [customText, setCustomText] = useState('')
  const [selectedDesign, setSelectedDesign] = useState('')
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  const { addItem } = useCartStore()
  
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
  
  // Get available designs and product settings
  const availableDesigns = getDesignsByProduct(product.slug)
  const productSettings = getProductSettings(product.slug)

  // Calculate total price adjustment from selected custom options
  const customOptions = product.custom_options || {}
  const optionPriceAdjustment = Object.entries(selectedCustomOptions).reduce((total, [type, value]) => {
    const options = customOptions[type] || []
    const selected = options.find(o => o.option_value === value)
    return total + (selected?.price_adjustment || 0)
  }, 0)
  
  // Mock product gallery images - in production these would come from the database
  const productGalleryImages = [
    product.image_url,
    `/images/products/${product.slug}-alt1.jpg`,
    `/images/products/${product.slug}-alt2.jpg`,
    `/images/products/${product.slug}-alt3.jpg`,
  ].filter((img): img is string => Boolean(img)) // Remove any null/undefined images

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, SVG, or PDF file')
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB')
      return
    }

    setUploadedFile(file)
    setSelectedDesign('') // Clear selected design when uploading file
    setError('')
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
    for (const [type, options] of Object.entries(customOptions)) {
      if (options.length > 0 && !selectedCustomOptions[type]) {
        setError(`Please select a ${type}`)
        return
      }
    }

    // Check if design is required (only if product requires it AND no options are provided)
    if (productSettings.requiresDesign && !uploadedFile && !customText.trim() && !selectedDesign) {
      setError('Please upload an image, add custom text, or select a design')
      return
    }

    // Get selected design info
    const selectedDesignInfo = selectedDesign ? availableDesigns.find(d => d.id === selectedDesign) : null

    // Calculate adjusted unit price (base tier price + option adjustments)
    const adjustedUnitPrice = priceData.pricePerUnit + optionPriceAdjustment
    const adjustedTotal = adjustedUnitPrice * quantity

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
      line_total: adjustedTotal,
      tier_applied: priceData.tierName,
      uploaded_file: uploadedFile,
      custom_text: customText.trim() || null,
      selected_design: selectedDesignInfo ? {
        id: selectedDesignInfo.id,
        name: selectedDesignInfo.name,
        description: selectedDesignInfo.description,
        imageUrl: selectedDesignInfo.imageUrl
      } : null,
      image_url: product.image_url,
    }

    addItem(cartItem)

    // Show success message (could be a toast notification)
    alert(`Added ${quantity} ${product.name} to cart!`)
  }

  return (
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
            {Object.entries(customOptions).map(([type, options]) => (
              options.length > 0 && (
                <div key={type}>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {type} *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {options.map((option) => (
                      <button
                        key={option.id}
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

            {/* Customization Options */}
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-semibold text-lg text-primary-600 mb-2">
                  Design Options
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  {productSettings.instructions}
                </p>
              </div>

              {/* Pre-selected Designs */}
              {availableDesigns.length > 0 && (
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
                          setUploadedFile(null) // Clear uploaded file when selecting design
                          setError('')
                        }}
                        className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedDesign === design.id
                            ? 'border-accent-coral-500 bg-accent-coral-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          {/* Placeholder for design thumbnail */}
                          <span className="text-2xl">🎨</span>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-accent-coral-700">
                          Selected: {availableDesigns.find(d => d.id === selectedDesign)?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OR Divider */}
              {availableDesigns.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="text-sm text-secondary-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Upload Your Own Design
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent-coral-500 transition-colors duration-200"
                  >
                    <div className="text-center">
                      {uploadedFile ? (
                        <div className="flex items-center space-x-2">
                          <DocumentArrowUpIcon className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            {uploadedFile.name}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <PhotoIcon className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                          <p className="text-sm text-secondary-600">
                            Click to upload PNG, JPG, SVG, or PDF
                          </p>
                          <p className="text-xs text-secondary-500">Max 50MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Text - Only show if product allows it */}
              {productSettings.allowsCustomText && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Custom Text (Optional)
                  </label>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Enter text you'd like printed on the product..."
                    rows={3}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Add custom text to personalize your product
                  </p>
                </div>
              )}

              <p className="text-xs text-secondary-500">
                * At least one customization option (image or text) is required
              </p>
            </div>

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

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="btn-primary w-full text-lg py-4"
            >
              Add to Cart - ${(priceData.totalPrice + optionPriceAdjustment * quantity).toFixed(2)}
            </button>

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
      </div>
    </div>
  )
}