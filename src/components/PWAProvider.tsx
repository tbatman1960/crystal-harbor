'use client'

import { useEffect, useState } from 'react'
import { 
  registerServiceWorker, 
  initInstallPrompt, 
  showInstallPrompt, 
  isAppInstalled,
  networkStatus,
  pushNotifications,
  pwaMetrics
} from '@/lib/pwa'
import { getDeviceInfo, mobileOptimizations } from '@/lib/mobile-detection'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface PWAProviderProps {
  children: React.ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)

  useEffect(() => {
    initializePWA()
  }, [])

  const initializePWA = async () => {
    // Get device info for optimizations
    const deviceInfo = getDeviceInfo()
    
    // Apply mobile optimizations
    if (deviceInfo.isMobile) {
      mobileOptimizations.enableSmoothScrolling()
      mobileOptimizations.addSafeAreaSupport()
    }

    // Register service worker
    const registration = await registerServiceWorker()
    if (registration) {
      console.log('PWA: Service worker registered')
      pwaMetrics.trackPWAEvent('service_worker_registered')
    }

    // Initialize install prompt
    initInstallPrompt()

    // Show install banner for eligible users
    setTimeout(() => {
      if (!isAppInstalled() && deviceInfo.isMobile) {
        setShowInstallBanner(true)
        pwaMetrics.trackPWAEvent('install_banner_shown')
      }
    }, 10000) // Show after 10 seconds

    // Setup network listeners
    networkStatus.initNetworkListeners(
      () => {
        setIsOnline(true)
        setShowOfflineNotice(false)
        pwaMetrics.trackPWAEvent('network_online')
      },
      () => {
        setIsOnline(false)
        setShowOfflineNotice(true)
        pwaMetrics.trackPWAEvent('network_offline')
      }
    )

    // Initialize network status
    setIsOnline(networkStatus.isOnline())

    // Request notification permission on mobile
    if (deviceInfo.isMobile && Notification.permission === 'default') {
      setTimeout(async () => {
        const permission = await pushNotifications.requestPermission()
        pwaMetrics.trackPWAEvent('notification_permission', { permission })
      }, 30000) // Ask after 30 seconds
    }
  }

  const handleInstallApp = async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      setShowInstallBanner(false)
      pwaMetrics.trackPWAEvent('app_installed_from_banner')
    }
  }

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    pwaMetrics.trackPWAEvent('install_banner_dismissed')
  }

  const dismissOfflineNotice = () => {
    setShowOfflineNotice(false)
  }

  return (
    <>
      {children}

      {/* Install App Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
          <div className="flex items-start space-x-3">
            <ArrowDownTrayIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Install Crystal Harbor App</h4>
              <p className="text-xs text-blue-100 mt-1">
                Get faster access and offline browsing
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstallApp}
                  className="bg-white text-primary-600 px-3 py-1.5 rounded text-sm font-semibold"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstallBanner}
                  className="text-blue-100 px-3 py-1.5 text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissInstallBanner}
              className="text-blue-100 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-16 left-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">You're offline</span>
            </div>
            <button
              onClick={dismissOfflineNotice}
              className="text-yellow-100 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-yellow-100 mt-1">
            You can still browse cached pages and your cart
          </p>
        </div>
      )}

      {/* PWA Status Indicator (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs p-2 rounded opacity-75 z-40">
          PWA: {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      )}
    </>
  )
}