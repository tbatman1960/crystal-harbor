'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'

interface SEOSettings {
  homepage_title: string
  homepage_description: string
  homepage_keywords: string
  homepage_og_image: string
  default_og_image: string
  organization_name: string
  organization_logo: string
  organization_contact_phone: string
  organization_address: string
  social_facebook: string
  social_twitter: string
  social_instagram: string
}

export default function AdminSEOPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { isAuthenticated } = useAdminStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SEOSettings>()

  useEffect(() => {
    if (isAuthenticated) {
      loadSEOSettings()
    }
  }, [isAuthenticated])

  const loadSEOSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('category', 'seo')

      if (error) throw error

      // Convert array of settings to object
      const settings: any = {}
      data?.forEach(setting => {
        settings[setting.key] = setting.value
      })

      // Set default values if none exist
      const defaultSettings: SEOSettings = {
        homepage_title: 'Crystal Harbor Trading Co. — Custom Printed T-Shirts, Blankets, Banners & Flags',
        homepage_description: 'Upload your design, choose your product, and we\'ll handle the rest. Quality custom printing with no minimums. Volume pricing available.',
        homepage_keywords: 'custom printing, t-shirts, banners, flags, blankets, personalized products, volume pricing, no minimum orders',
        homepage_og_image: '/icons/icon-192x192.png',
        default_og_image: '/icons/icon-192x192.png',
        organization_name: 'Crystal Harbor Trading Company',
        organization_logo: '/icons/icon-192x192.png',
        organization_contact_phone: '+1-555-CRYSTAL',
        organization_address: 'United States',
        social_facebook: '',
        social_twitter: '',
        social_instagram: '',
        ...settings
      }

      reset(defaultSettings)
    } catch (err) {
      console.error('Error loading SEO settings:', err)
      setMessage('Error loading settings')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SEOSettings) => {
    setIsSaving(true)
    setMessage('')

    try {
      // Convert object to array of settings
      const settingsArray = Object.entries(data).map(([key, value]) => ({
        category: 'seo',
        key,
        value: value || ''
      }))

      // Delete existing SEO settings
      await supabase
        .from('site_settings')
        .delete()
        .eq('category', 'seo')

      // Insert new settings
      const { error } = await supabase
        .from('site_settings')
        .insert(settingsArray)

      if (error) throw error

      setMessage('SEO settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error saving SEO settings:', err)
      setMessage('Error saving settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Please log in to access the admin panel.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading-pulse">Loading SEO settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-600">SEO Settings</h1>
        <div className="text-sm text-secondary-600">
          Configure meta titles, descriptions, and structured data
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Homepage SEO */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Homepage SEO</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Page Title *
              </label>
              <input
                type="text"
                {...register('homepage_title', { required: 'Homepage title is required' })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="Crystal Harbor Trading Co. — Custom Printed..."
              />
              {errors.homepage_title && (
                <p className="text-red-500 text-sm mt-1">{errors.homepage_title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Meta Description *
              </label>
              <textarea
                {...register('homepage_description', { required: 'Homepage description is required' })}
                rows={3}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="Upload your design, choose your product..."
              />
              {errors.homepage_description && (
                <p className="text-red-500 text-sm mt-1">{errors.homepage_description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                {...register('homepage_keywords')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="custom printing, t-shirts, banners..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Open Graph Image URL
              </label>
              <input
                type="text"
                {...register('homepage_og_image')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="/images/crystal-harbor-og-image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Organization Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Organization Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                {...register('organization_name', { required: 'Organization name is required' })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Logo URL
              </label>
              <input
                type="text"
                {...register('organization_logo')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="/icons/icon-192x192.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Contact Phone
              </label>
              <input
                type="text"
                {...register('organization_contact_phone')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="+1-555-CRYSTAL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Address
              </label>
              <input
                type="text"
                {...register('organization_address')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Social Media</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                {...register('social_facebook')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="https://facebook.com/crystalharbor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                {...register('social_twitter')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="https://twitter.com/crystalharbor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                {...register('social_instagram')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="https://instagram.com/crystalharbor"
              />
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Default Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Default Open Graph Image
              </label>
              <input
                type="text"
                {...register('default_og_image')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
                placeholder="/icons/icon-192x192.png"
              />
              <p className="text-xs text-secondary-500 mt-1">
                Used when pages don't have a specific image set
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-medium ${
              isSaving
                ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                : 'bg-accent-lime-600 text-white hover:bg-accent-lime-700'
            } transition-colors`}
          >
            {isSaving ? 'Saving...' : 'Save SEO Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}