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
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline'

interface PWAProviderProps {
  children: React.ReactNode
}

// Detect iOS Safari
const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
  return isIOS || isSafari
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showSafariInstructions, setShowSafariInstructions] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    setIsSafari(isIOSSafari())
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

    // Request notification permission on mobile (not on iOS Safari)
    if (deviceInfo.isMobile && !isIOSSafari() && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setTimeout(async () => {
        const permission = await pushNotifications.requestPermission()
        pwaMetrics.trackPWAEvent('notification_permission', { permission })
      }, 30000)
    }
  }

  const handleInstallApp = async () => {
    // Try the native install prompt first (works on Chrome/Edge Android)
    if (!isSafari) {
      const installed = await showInstallPrompt()
      if (installed) {
        setShowInstallBanner(false)
        pwaMetrics.trackPWAEvent('app_installed_from_banner')
        return
      }
    }

    // If native prompt didn't work or this is Safari/iOS, show manual instructions
    setShowSafariInstructions(true)
    pwaMetrics.trackPWAEvent('manual_install_instructions_shown')
  }

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    setShowSafariInstructions(false)
    pwaMetrics.trackPWAEvent('install_banner_dismissed')
  }

  const dismissOfflineNotice = () => {
    setShowOfflineNotice(false)
  }

  return (
    <>
      {children}

      {/* Install App Banner */}
      {showInstallBanner && !showSafariInstructions && (
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

      {/* Safari/iOS Install Instructions */}
      {showSafariInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display font-bold text-lg text-primary-600">
                Install Crystal Harbor
              </h3>
              <button
                onClick={dismissInstallBanner}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-secondary-600 text-sm mb-6">
              Add Crystal Harbor to your home screen for quick access:
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700 text-sm">
                    Tap the Share button
                  </p>
                  <p className="text-secondary-500 text-xs mt-0.5">
                    Look for the <span className="inline-flex items-center"><ShareIcon className="h-4 w-4 inline" /></span> icon at the bottom of Safari
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700 text-sm">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                  <p className="text-secondary-500 text-xs mt-0.5">
                    You may need to scroll down in the share menu
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700 text-sm">
                    Tap "Add" to confirm
                  </p>
                  <p className="text-secondary-500 text-xs mt-0.5">
                    Crystal Harbor will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={dismissInstallBanner}
              className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors"
            >
              Got It!
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
              <span className="text-sm font-medium">You&apos;re offline</span>
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