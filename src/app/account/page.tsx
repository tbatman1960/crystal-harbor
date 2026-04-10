'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
// Account data fetched via API routes (not direct Supabase) due to RLS
import { PencilIcon, MapPinIcon, CheckIcon, XMarkIcon, EnvelopeIcon, ChatBubbleLeftIcon, ArrowPathIcon, XCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  email: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
}

export default function AccountPage() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [customerData, setCustomerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [orderDetails, setOrderDetails] = useState<Record<string, any>>({})
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address_line_1: user?.address_line_1 || '',
      address_line_2: user?.address_line_2 || '',
      city: user?.city || '',
      state: user?.state || '',
      postal_code: user?.postal_code || '',
      country: user?.country || 'US'
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirectTo=/account')
      return
    }

    loadOrders()
  }, [isAuthenticated, user?.id])

  // Reset form when user data changes
  useEffect(() => {
    if (user && !isEditing) {
      reset({
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        phone: user.phone || '',
        email: user.email || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postal_code || '',
        country: user.country || 'US'
      })
    }
  }, [user, reset, isEditing])

  const loadOrders = async () => {
    if (!user?.id) return

    try {
      // Load orders via API route
      const ordersRes = await fetch(`/api/account/orders?customer_id=${user.id}`)
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json()
        setOrders(ordersJson.orders || [])
      } else {
        console.error('Error loading orders')
      }

      // Load customer data via API route
      const profileRes = await fetch(`/api/account/profile?customer_id=${user.id}`)
      const { customer: customerData } = profileRes.ok ? await profileRes.json() : { customer: null }
      const customerError = !profileRes.ok

      if (customerError) {
        console.error('Error loading customer data:', customerError)
      } else {
        setCustomerData(customerData)
      }
    } catch (error) {
      console.error('Error loading account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleEditProfile = () => {
    setMessage(null)
    setIsEditing(true)
    reset({
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || ''
    })
  }

  const handleCancelEdit = () => {
    setMessage(null)
    setIsEditing(false)
    reset({
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || ''
    })
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return

    setSaving(true)
    setMessage(null)

    try {
      // Update in database via API route
      const updateRes = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          email: data.email,
          address_line_1: data.address_line_1 || null,
          address_line_2: data.address_line_2 || null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.postal_code || null,
          country: data.country || 'US',
        })
      })

      if (!updateRes.ok) {
        console.error('Error updating profile')
        setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
        return
      }

      // Update auth store
      updateUser({
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country
      })

      // Refresh customer data
      await loadOrders()
      
      setIsEditing(false)
      setIsEditingAddress(false) // Close address editing if it was open
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge badge-warning'
      case 'processing':
        return 'badge badge-info'
      case 'shipped':
        return 'badge badge-info'
      case 'delivered':
        return 'badge badge-success'
      case 'cancelled':
        return 'badge badge-error'
      default:
        return 'badge'
    }
  }

  const handleContactUs = () => {
    if (!user) return
    
    const subject = encodeURIComponent(`Customer Support - ${user.firstName} ${user.lastName}`)
    const body = encodeURIComponent(`Hello Crystal Harbor Trading Company,

I am contacting you regarding my account.

Customer Information:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Phone: ${user.phone || 'Not provided'}
- Customer ID: ${user.id}

${user.address_line_1 ? `
Address:
${user.address_line_1}${user.address_line_2 ? `\n${user.address_line_2}` : ''}
${user.city}, ${user.state} ${user.postal_code}
${user.country || 'US'}
` : ''}

Please let me know how I can be assisted.

Thank you,
${user.firstName} ${user.lastName}`)

    const mailtoUrl = `mailto:info@crystalharbortc.com?subject=${subject}&body=${body}`
    window.location.href = mailtoUrl
  }

  const handleEmailAboutOrder = (order: Order) => {
    if (!user) return
    
    const subject = encodeURIComponent(`Order Inquiry - ${order.order_number}`)
    const body = encodeURIComponent(`Hello Crystal Harbor Trading Company,

I have a question about my order.

Order Information:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleDateString()}
- Order Total: $${order.total_amount.toFixed(2)}
- Status: ${order.status}

Customer Information:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Phone: ${user.phone || 'Not provided'}

My question/concern:
[Please describe your question or concern here]

Thank you,
${user.firstName} ${user.lastName}`)

    const mailtoUrl = `mailto:info@crystalharbortc.com?subject=${subject}&body=${body}`
    window.location.href = mailtoUrl
  }

  const handleInitiateReturn = (order: Order) => {
    if (!user) return
    
    const subject = encodeURIComponent(`Return Request - ${order.order_number}`)
    const body = encodeURIComponent(`Hello Crystal Harbor Trading Company,

I would like to initiate a return for my order.

Order Information:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleDateString()}
- Order Total: $${order.total_amount.toFixed(2)}
- Status: ${order.status}

Customer Information:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Phone: ${user.phone || 'Not provided'}

Return Reason:
☐ Defective/Damaged item
☐ Wrong item received  
☐ Size/fit issue
☐ Not as described
☐ Changed mind
☐ Other: ________________

Additional Details:
[Please provide any additional information about the return]

I understand that returns must be initiated within your return policy timeframe. Please let me know the next steps.

Thank you,
${user.firstName} ${user.lastName}`)

    const mailtoUrl = `mailto:info@crystalharbortc.com?subject=${subject}&body=${body}`
    window.location.href = mailtoUrl
  }

  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)
  const [reorderingOrder, setReorderingOrder] = useState<string | null>(null)
  const { addItem } = useCartStore()

  const handleCancelOrder = async (order: Order) => {
    if (order.status === 'pending') {
      // Pending orders get full refund automatically
      if (!confirm(`Cancel order ${order.order_number}? You will receive a full refund of $${order.total_amount.toFixed(2)}.`)) return
      
      setCancellingOrder(order.id)
      try {
        const res = await fetch('/api/orders/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: order.id, customer_id: user?.id, order_number: order.order_number })
        })
        const result = await res.json()
        
        if (res.ok && result.success) {
          alert(result.refundProcessed 
            ? `Order cancelled! A refund of $${result.refundAmount?.toFixed(2) || order.total_amount.toFixed(2)} will be processed within 3-5 business days.`
            : 'Order cancelled successfully!')
          await loadOrders()
        } else {
          alert(result.error || 'Failed to cancel order')
        }
      } catch (error) {
        console.error('Error cancelling order:', error)
        alert('An error occurred. Please try again.')
      } finally {
        setCancellingOrder(null)
      }
    } else {
      // Non-pending orders: send email to admin for review
      if (!user) return
      const subject = encodeURIComponent(`Cancellation/Refund Request - ${order.order_number}`)
      const body = encodeURIComponent(`Hello Crystal Harbor Trading Company,

I would like to request a cancellation/refund for my order.

Order Information:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleDateString()}
- Order Total: $${order.total_amount.toFixed(2)}
- Current Status: ${order.status}

Customer Information:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}

Reason for cancellation/refund:
[Please describe your reason here]

Thank you,
${user.firstName} ${user.lastName}`)

      window.location.href = `mailto:info@crystalharbortc.com?subject=${subject}&body=${body}`
    }
  }

  const handleReorder = async (order: Order) => {
    setReorderingOrder(order.id)
    try {
      // Fetch order details with items
      const res = await fetch(`/api/orders/${order.order_number}`)
      if (!res.ok) {
        alert('Could not load order details. Please try again.')
        return
      }
      const data = await res.json()
      const orderItems = data.order.order_items || []

      if (orderItems.length === 0) {
        alert('No items found in this order.')
        return
      }

      // Fetch product details for each item
      const productsRes = await fetch('/api/products')
      const productsData = await productsRes.json()
      const products = productsData.products || []

      let addedCount = 0
      for (const item of orderItems) {
        // Find the matching product by name (product_id may not be in the order items response)
        const product = products.find((p: any) => p.name === item.product_name)
        if (product) {
          addItem({
            id: `reorder-${product.id}-${item.selected_size || ''}-${item.selected_color || ''}-${Date.now()}`,
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            category_slug: product.category?.slug || '',
            selected_size: item.selected_size || '',
            selected_color: item.selected_color || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            customization_fee: item.customization_fee || 0,
            line_total: (item.unit_price + (item.customization_fee || 0)) * item.quantity,
            tier_applied: item.tier_applied || '',
            uploaded_file: null,
            custom_text: item.custom_text || null,
            selected_design: null,
            customization_data: item.customization_data || null,
            image_url: product.image_url || null,
          })
          addedCount++
        }
      }

      if (addedCount > 0) {
        router.push('/cart')
      } else {
        alert('Some products may no longer be available. Please browse our products to reorder.')
        router.push('/products')
      }
    } catch (error) {
      console.error('Error reordering:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setReorderingOrder(null)
    }
  }

  const handleReorderWithCustomDesign = async (order: Order, item: any) => {
    if (!item.customization_data) return

    try {
      // Store the design data in sessionStorage for customization editing
      const editData = {
        isEditing: false, // Not editing existing cart item, creating new
        customizationData: item.customization_data,
        isReordering: true, // Flag to indicate this is a reorder
        returnToCart: true
      }
      sessionStorage.setItem('crystal-harbor-edit-design', JSON.stringify(editData))

      // Find the product slug and category
      const productsRes = await fetch('/api/products')
      const productsData = await productsRes.json()
      const products = productsData.products || []
      const product = products.find((p: any) => p.name === item.product_name)

      if (product) {
        // Navigate to product page which will detect the reorder data
        window.location.href = `/products/${product.category?.slug || 'apparel'}/${product.slug}`
      } else {
        alert('This product may no longer be available.')
      }
    } catch (error) {
      console.error('Error setting up custom reorder:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const loadOrderDetails = async (order: Order) => {
    if (orderDetails[order.id]) return // Already loaded

    try {
      const res = await fetch(`/api/orders/${order.order_number}`)
      if (res.ok) {
        const data = await res.json()
        setOrderDetails(prev => ({
          ...prev,
          [order.id]: data.order
        }))
      }
    } catch (error) {
      console.error('Error loading order details:', error)
    }
  }

  const toggleOrderExpansion = async (order: Order) => {
    const isCurrentlyExpanded = expandedOrders.has(order.id)
    
    if (!isCurrentlyExpanded) {
      await loadOrderDetails(order)
    }

    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyExpanded) {
        newSet.delete(order.id)
      } else {
        newSet.add(order.id)
      }
      return newSet
    })
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="section-padding bg-background-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary-600 mb-4">Please sign in to view your account.</p>
          <Link href="/auth/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
              My Account
            </h1>
            <p className="text-secondary-600">
              Welcome back, {user.firstName} {user.lastName}
            </p>
          </div>
          <Link href="/products" className="btn-primary flex items-center">
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            Start Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-xl text-primary-600">
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={handleEditProfile}
                    className="p-2 text-secondary-500 hover:text-accent-coral-500 transition-colors"
                    title="Edit Profile"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Success/Error Message */}
              {message && (
                <div className={`p-3 rounded-lg mb-4 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {message.type === 'success' ? '✓' : '⚠'} {message.text}
                    </span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        {...register('first_name', { 
                          required: 'First name is required',
                          minLength: { value: 1, message: 'First name cannot be empty' },
                          pattern: { 
                            value: /^[a-zA-Z\s'-]+$/, 
                            message: 'First name can only contain letters, spaces, hyphens and apostrophes' 
                          }
                        })}
                        className="input-field"
                        placeholder="Enter your first name"
                      />
                      {errors.first_name && (
                        <p className="form-error">{errors.first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        {...register('last_name', { 
                          required: 'Last name is required',
                          minLength: { value: 1, message: 'Last name cannot be empty' },
                          pattern: { 
                            value: /^[a-zA-Z\s'-]+$/, 
                            message: 'Last name can only contain letters, spaces, hyphens and apostrophes' 
                          }
                        })}
                        className="input-field"
                        placeholder="Enter your last name"
                      />
                      {errors.last_name && (
                        <p className="form-error">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="input-field"
                    />
                    {errors.email && (
                      <p className="form-error">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Phone (Optional)</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input-field"
                      placeholder="(317) 997-5503"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="btn-outline flex-1 flex items-center justify-center space-x-2"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-secondary-600">Name</label>
                      <p className="text-neutral-700">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-secondary-600">Email</label>
                      <p className="text-neutral-700">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-secondary-600">Phone</label>
                      <p className="text-neutral-700">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <button 
                      onClick={handleEditProfile}
                      className="btn-outline w-full text-sm"
                    >
                      Edit Profile
                    </button>
                    <button 
                      onClick={handleContactUs}
                      className="flex items-center justify-center space-x-2 w-full text-sm bg-accent-lime-100 hover:bg-accent-lime-200 text-accent-lime-700 hover:text-accent-lime-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>Contact Support</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Saved Address */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-xl text-primary-600">
                  Shipping Address
                </h2>
                <button 
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="p-2 text-secondary-500 hover:text-accent-coral-500 transition-colors"
                  title={isEditingAddress ? "Cancel" : "Edit Address"}
                >
                  {isEditingAddress ? <XMarkIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                </button>
              </div>
              
              {isEditingAddress ? (
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="form-label">Address Line 1 *</label>
                      <input
                        type="text"
                        {...register('address_line_1', { 
                          required: 'Address is required'
                        })}
                        className="input-field"
                        placeholder="Street address"
                      />
                      {errors.address_line_1 && (
                        <p className="form-error">{errors.address_line_1.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Address Line 2</label>
                      <input
                        type="text"
                        {...register('address_line_2')}
                        className="input-field"
                        placeholder="Apartment, suite, unit, building, floor, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          {...register('city', { 
                            required: 'City is required'
                          })}
                          className="input-field"
                          placeholder="City"
                        />
                        {errors.city && (
                          <p className="form-error">{errors.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          {...register('state', { 
                            required: 'State is required'
                          })}
                          className="input-field"
                          placeholder="State"
                        />
                        {errors.state && (
                          <p className="form-error">{errors.state.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">ZIP Code *</label>
                        <input
                          type="text"
                          {...register('postal_code', { 
                            required: 'ZIP code is required'
                          })}
                          className="input-field"
                          placeholder="ZIP Code"
                        />
                        {errors.postal_code && (
                          <p className="form-error">{errors.postal_code.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Country *</label>
                        <select
                          {...register('country', { 
                            required: 'Country is required'
                          })}
                          className="input-field"
                        >
                          <option value="US">United States</option>
                        </select>
                        {errors.country && (
                          <p className="form-error">{errors.country.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex-1"
                    >
                      {saving ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAddress(false)
                        reset() // Reset form to original values
                      }}
                      className="btn-outline flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-secondary-500 mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    {customerData?.address_line_1 || user?.address_line_1 ? (
                      <div className="space-y-1">
                        <div className="text-neutral-700 font-medium">Default Address</div>
                        <div className="text-secondary-600">
                          <div>{customerData?.address_line_1 || user?.address_line_1}</div>
                          {(customerData?.address_line_2 || user?.address_line_2) && (
                            <div>{customerData?.address_line_2 || user?.address_line_2}</div>
                          )}
                          <div>
                            {customerData?.city || user?.city}, {customerData?.state || user?.state} {customerData?.postal_code || user?.postal_code}
                          </div>
                          <div>{customerData?.country || user?.country || 'US'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-secondary-600">
                        <div className="text-neutral-700 font-medium mb-1">No Address Saved</div>
                        <div className="space-y-0.5">
                          <div>Click the edit button above to add your</div>
                          <div>default shipping address for faster checkout.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                Order History
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="loading-pulse">Loading orders...</div>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id)
                    const details = orderDetails[order.id]
                    const hasCustomItems = details?.order_items?.some((item: any) => item.customization_data) || false
                    
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-neutral-700">
                              Order {order.order_number}
                              {hasCustomItems && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                  🎨 Custom Items
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-secondary-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-700">
                              ${order.total_amount.toFixed(2)}
                            </p>
                            <span className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/orders/${order.order_number}`}
                              className="text-accent-coral-500 hover:text-accent-coral-600 text-sm font-medium"
                            >
                              View Details →
                            </Link>
                            <button
                              onClick={() => toggleOrderExpansion(order)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {isExpanded ? 'Hide Items ↑' : 'Show Items ↓'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleReorder(order)}
                              disabled={reorderingOrder === order.id}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 text-xs font-medium rounded-full transition-colors duration-200 disabled:opacity-50"
                              title="Add these items to cart"
                            >
                              <ShoppingCartIcon className="w-3 h-3 mr-1" />
                              {reorderingOrder === order.id ? 'Adding...' : 'Reorder'}
                            </button>
                            {order.status === 'cancelled' ? (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                ✓ Refund processed — no further refunds or returns available
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEmailAboutOrder(order)}
                                  className="inline-flex items-center px-3 py-1 bg-accent-lime-100 hover:bg-accent-lime-200 text-accent-lime-700 hover:text-accent-lime-800 text-xs font-medium rounded-full transition-colors duration-200"
                                  title="Email about this order"
                                >
                                  <EnvelopeIcon className="w-3 h-3 mr-1" />
                                  Email About Order
                                </button>
                                <button
                                  onClick={() => handleInitiateReturn(order)}
                                  className="inline-flex items-center px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 text-xs font-medium rounded-full transition-colors duration-200"
                                  title="Request return"
                                >
                                  <ArrowPathIcon className="w-3 h-3 mr-1" />
                                  Return
                                </button>
                                {order.status !== 'delivered' && (
                                  <button
                                    onClick={() => handleCancelOrder(order)}
                                    disabled={cancellingOrder === order.id}
                                    className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 text-xs font-medium rounded-full transition-colors duration-200 disabled:opacity-50"
                                    title={order.status === 'pending' ? 'Cancel for full refund' : 'Request cancellation'}
                                  >
                                    <XCircleIcon className="w-3 h-3 mr-1" />
                                    {cancellingOrder === order.id ? 'Cancelling...' : order.status === 'pending' ? 'Cancel Order' : 'Request Cancel'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded order items */}
                        {isExpanded && details && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-neutral-700 mb-3">Order Items</h4>
                            <div className="space-y-3">
                              {details.order_items?.map((item: any, index: number) => (
                                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-neutral-700">{item.product_name}</p>
                                    <div className="text-sm text-secondary-600 space-y-1">
                                      <div>
                                        {item.selected_size && <span>Size: {item.selected_size} • </span>}
                                        {item.selected_color && <span>Color: {item.selected_color} • </span>}
                                        <span>Qty: {item.quantity}</span>
                                      </div>
                                      {item.custom_text && (
                                        <div><strong>Custom Text:</strong> {item.custom_text}</div>
                                      )}
                                      {item.customization_data && (
                                        <div className="flex items-center text-purple-600">
                                          🎨 <span className="ml-1">Custom Design</span>
                                          {item.customization_data.lowResWarnings?.length > 0 && (
                                            <span className="ml-2 text-yellow-600" title="Low resolution warning">⚠️</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-semibold text-neutral-700">
                                      ${item.line_total.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-secondary-500">
                                      ${item.unit_price.toFixed(2)} base
                                      {item.customization_fee > 0 && (
                                        <div className="text-purple-600">+${item.customization_fee.toFixed(2)} custom</div>
                                      )}
                                    </div>
                                    {item.customization_data && (
                                      <button
                                        onClick={() => handleReorderWithCustomDesign(order, item)}
                                        className="mt-2 inline-flex items-center px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 text-xs font-medium rounded transition-colors duration-200"
                                        title="Reorder with the same custom design"
                                      >
                                        🎨 Reorder Design
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary-600 mb-4">No orders yet</p>
                  <Link href="/products" className="btn-primary">
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}