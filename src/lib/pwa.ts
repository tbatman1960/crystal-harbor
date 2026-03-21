// Progressive Web App utilities and service worker management

// Check if service worker is supported
export const isPWASupported = (): boolean => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPWASupported()) {
    console.log('PWA: Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('PWA: Service Worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('PWA: New service worker available')
            // Show update notification to user
            showUpdateNotification()
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('PWA: Service Worker registration failed:', error)
    return null
  }
}

// Show update notification
const showUpdateNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('Crystal Harbor Update Available', {
      body: 'A new version of the app is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
      tag: 'app-update',
      requireInteraction: true
    })
  }
}

// Check for app updates
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isPWASupported()) return false

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      return true
    }
  } catch (error) {
    console.error('PWA: Update check failed:', error)
  }
  
  return false
}

// Install prompt management
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

// Listen for install prompt
export const initInstallPrompt = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: Install prompt available')
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
  })

  // Track successful install
  window.addEventListener('appinstalled', () => {
    console.log('PWA: App installed successfully')
    deferredPrompt = null
    
    // Track install analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore - gtag is a global function when Google Analytics is loaded
      window.gtag('event', 'pwa_installed', {
        event_category: 'PWA',
        event_label: 'App Install'
      })
    }
  })
}

// Show install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('PWA: Install prompt not available')
    return false
  }

  try {
    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    
    console.log('PWA: Install prompt result:', choiceResult.outcome)
    deferredPrompt = null
    
    return choiceResult.outcome === 'accepted'
  } catch (error) {
    console.error('PWA: Install prompt error:', error)
    return false
  }
}

// Check if app is installed
export const isAppInstalled = (): boolean => {
  return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
}

// Offline storage management
export const offlineStorage = {
  // Store order for offline submission
  storeOfflineOrder: async (orderData: any): Promise<void> => {
    if (typeof window === 'undefined') return

    try {
      const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]')
      offlineOrders.push({
        id: Date.now(),
        data: orderData,
        timestamp: Date.now(),
        synced: false
      })
      
      localStorage.setItem('offline_orders', JSON.stringify(offlineOrders))
      console.log('PWA: Order stored for offline submission')
      
      // Request background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        // @ts-ignore - sync is experimental API
        await registration.sync.register('background-sync-orders')
      }
    } catch (error) {
      console.error('PWA: Failed to store offline order:', error)
    }
  },

  // Get offline orders
  getOfflineOrders: (): any[] => {
    if (typeof window === 'undefined') return []

    try {
      return JSON.parse(localStorage.getItem('offline_orders') || '[]')
    } catch (error) {
      console.error('PWA: Failed to retrieve offline orders:', error)
      return []
    }
  },

  // Clear synced orders
  clearSyncedOrders: (): void => {
    if (typeof window === 'undefined') return

    try {
      const offlineOrders = offlineStorage.getOfflineOrders()
      const pendingOrders = offlineOrders.filter(order => !order.synced)
      localStorage.setItem('offline_orders', JSON.stringify(pendingOrders))
    } catch (error) {
      console.error('PWA: Failed to clear synced orders:', error)
    }
  }
}

// Network status management
export const networkStatus = {
  isOnline: (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  },

  // Setup network listeners
  initNetworkListeners: (onOnline?: () => void, onOffline?: () => void) => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      console.log('PWA: Network connection restored')
      onOnline?.()
    })

    window.addEventListener('offline', () => {
      console.log('PWA: Network connection lost')
      onOffline?.()
    })
  }
}

// Push notification management
export const pushNotifications = {
  // Request permission
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('PWA: Push notifications not supported')
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    console.log('PWA: Notification permission:', permission)
    
    return permission
  },

  // Subscribe to push notifications
  subscribe: async (): Promise<PushSubscription | null> => {
    if (!isPWASupported()) return null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Note: In production, you'd need a VAPID key here
        applicationServerKey: null
      })

      console.log('PWA: Push subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('PWA: Push subscription failed:', error)
      return null
    }
  },

  // Send local notification
  sendLocal: (title: string, options?: NotificationOptions): void => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options
      })
    }
  }
}

// PWA metrics and analytics
export const pwaMetrics = {
  // Track PWA usage
  trackPWAEvent: (event: string, data?: any) => {
    console.log(`PWA: ${event}`, data)
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore - gtag is a global function when Google Analytics is loaded
      window.gtag('event', event, {
        event_category: 'PWA',
        event_label: data?.label || event,
        custom_data: data
      })
    }
  },

  // Get installation status
  getInstallationStatus: () => {
    return {
      isInstalled: isAppInstalled(),
      isPWASupported: isPWASupported(),
      isOnline: networkStatus.isOnline(),
      hasNotificationPermission: typeof Notification !== 'undefined' && Notification.permission === 'granted'
    }
  }
}