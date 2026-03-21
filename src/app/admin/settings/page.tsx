'use client'

import { useEffect, useState } from 'react'
import { getSiteSettings, updateSiteSetting } from '@/lib/admin'
import { 
  BuildingStorefrontIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Setting {
  key: string
  value: string
  label: string
  description: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea'
  icon: any
  category: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedSettings, setSavedSettings] = useState<Set<string>>(new Set())

  const settingDefinitions: Setting[] = [
    {
      key: 'site_name',
      value: '',
      label: 'Site Name',
      description: 'The name of your website',
      type: 'text',
      icon: BuildingStorefrontIcon,
      category: 'General'
    },
    {
      key: 'contact_email',
      value: '',
      label: 'Contact Email',
      description: 'Customer support email address',
      type: 'email',
      icon: EnvelopeIcon,
      category: 'Contact'
    },
    {
      key: 'contact_phone',
      value: '',
      label: 'Contact Phone',
      description: 'Customer support phone number',
      type: 'tel',
      icon: PhoneIcon,
      category: 'Contact'
    },
    {
      key: 'business_hours',
      value: '',
      label: 'Business Hours',
      description: 'When customers can reach you',
      type: 'text',
      icon: ClockIcon,
      category: 'Contact'
    },
    {
      key: 'default_shipping_rate',
      value: '',
      label: 'Default Shipping Rate',
      description: 'Default shipping cost in USD',
      type: 'number',
      icon: TruckIcon,
      category: 'Shipping'
    },
    {
      key: 'fulfillment_time',
      value: '',
      label: 'Fulfillment Time',
      description: 'How long orders take to complete',
      type: 'text',
      icon: ClockIcon,
      category: 'Orders'
    }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await getSiteSettings()
      setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
    // Remove from saved settings when changed
    setSavedSettings(prev => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
    })
  }

  const saveSetting = async (key: string, value: string) => {
    setSaving(key)
    try {
      const result = await updateSiteSetting(key, value)
      if (result.success) {
        setSavedSettings(prev => new Set(prev).add(key))
        setTimeout(() => {
          setSavedSettings(prev => {
            const newSet = new Set(prev)
            newSet.delete(key)
            return newSet
          })
        }, 2000)
      } else {
        alert('Failed to save setting')
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      alert('Error saving setting')
    } finally {
      setSaving(null)
    }
  }

  const saveAllSettings = async () => {
    setSaving('all')
    try {
      const promises = settingDefinitions.map(setting => 
        updateSiteSetting(setting.key, settings[setting.key] || '')
      )
      
      await Promise.all(promises)
      
      // Show all as saved briefly
      const allKeys = new Set(settingDefinitions.map(s => s.key))
      setSavedSettings(allKeys)
      
      setTimeout(() => {
        setSavedSettings(new Set())
      }, 2000)
      
    } catch (error) {
      console.error('Error saving all settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(null)
    }
  }

  const groupedSettings = settingDefinitions.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as { [category: string]: Setting[] })

  if (loading) {
    return (
      <div className="section-padding">
        <div className="loading-pulse">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
            Settings
          </h1>
          <p className="text-secondary-600">
            Configure your site settings and preferences
          </p>
        </div>
        <button
          onClick={saveAllSettings}
          disabled={saving === 'all'}
          className="btn-primary flex items-center space-x-2"
        >
          {saving === 'all' ? (
            <div className="loading-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
          <span>{saving === 'all' ? 'Saving...' : 'Save All'}</span>
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="card p-8">
            <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
              {category}
            </h2>
            
            <div className="space-y-6">
              {categorySettings.map((setting) => {
                const currentValue = settings[setting.key] || ''
                const isSaved = savedSettings.has(setting.key)
                const isSaving = saving === setting.key
                
                return (
                  <div key={setting.key} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <setting.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-semibold text-neutral-700 mb-1">
                        {setting.label}
                      </label>
                      <p className="text-sm text-secondary-600 mb-3">
                        {setting.description}
                      </p>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          {setting.type === 'textarea' ? (
                            <textarea
                              value={currentValue}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              className="input-field resize-none"
                              rows={3}
                            />
                          ) : (
                            <input
                              type={setting.type}
                              value={currentValue}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              className="input-field"
                              step={setting.type === 'number' ? '0.01' : undefined}
                            />
                          )}
                        </div>
                        
                        <button
                          onClick={() => saveSetting(setting.key, currentValue)}
                          disabled={isSaving}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            isSaved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {isSaving ? (
                            <div className="loading-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : isSaved ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Configuration */}
      <div className="card p-8 mt-8">
        <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
          Advanced Configuration
        </h2>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              Stripe Integration
            </h3>
            <p className="text-blue-600 text-sm mb-3">
              Payment processing is configured through environment variables for security.
            </p>
            <div className="text-xs text-blue-500">
              <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code><br/>
              <code>STRIPE_SECRET_KEY</code>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Telegram Notifications
            </h3>
            <p className="text-green-600 text-sm mb-3">
              Large order alerts are configured through environment variables.
            </p>
            <div className="text-xs text-green-500">
              <code>TELEGRAM_BOT_TOKEN</code><br/>
              <code>TELEGRAM_CHAT_ID</code>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">
              Database & Storage
            </h3>
            <p className="text-purple-600 text-sm mb-3">
              Supabase configuration for database and file storage.
            </p>
            <div className="text-xs text-purple-500">
              <code>NEXT_PUBLIC_SUPABASE_URL</code><br/>
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}