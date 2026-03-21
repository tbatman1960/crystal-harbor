// Mobile device detection and capabilities

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  isFirefox: boolean
  isSamsung: boolean
  hasTouch: boolean
  isStandalone: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
  os: string
  browser: string
  viewportSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

// Get comprehensive device information
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    // Server-side defaults
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isSamsung: false,
      hasTouch: false,
      isStandalone: false,
      deviceType: 'desktop',
      os: 'unknown',
      browser: 'unknown',
      viewportSize: 'lg'
    }
  }

  const userAgent = navigator.userAgent
  const viewport = window.innerWidth

  // Operating System Detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(userAgent)
  const isWindows = /Windows/.test(userAgent)
  const isMacOS = /Macintosh/.test(userAgent)
  const isLinux = /Linux/.test(userAgent)

  // Browser Detection
  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent)
  const isChrome = /Chrome|Chromium/.test(userAgent) && !/Edg/.test(userAgent)
  const isFirefox = /Firefox/.test(userAgent)
  const isEdge = /Edg/.test(userAgent)
  const isSamsung = /SamsungBrowser/.test(userAgent)

  // Device Type Detection
  const isMobile = /Mobi|Android/i.test(userAgent) || viewport < 768
  const isTablet = (isIOS && !/iPhone/.test(userAgent)) || 
    (isAndroid && !/Mobi/.test(userAgent)) || 
    (viewport >= 768 && viewport < 1024)
  
  // Touch Capability
  const hasTouch = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    // @ts-ignore - For older browsers
    navigator.msMaxTouchPoints > 0

  // PWA Detection
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore - For iOS Safari
    window.navigator.standalone === true

  // Viewport Size Classification
  let viewportSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'lg'
  if (viewport < 480) viewportSize = 'xs'
  else if (viewport < 640) viewportSize = 'sm'
  else if (viewport < 1024) viewportSize = 'md'
  else if (viewport < 1280) viewportSize = 'lg'
  else viewportSize = 'xl'

  // Determine primary device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (isMobile && !isTablet) deviceType = 'mobile'
  else if (isTablet) deviceType = 'tablet'

  // Determine OS
  let os = 'unknown'
  if (isIOS) os = 'iOS'
  else if (isAndroid) os = 'Android'
  else if (isWindows) os = 'Windows'
  else if (isMacOS) os = 'macOS'
  else if (isLinux) os = 'Linux'

  // Determine Browser
  let browser = 'unknown'
  if (isSamsung) browser = 'Samsung Internet'
  else if (isChrome) browser = 'Chrome'
  else if (isSafari) browser = 'Safari'
  else if (isFirefox) browser = 'Firefox'
  else if (isEdge) browser = 'Edge'

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isSamsung,
    hasTouch,
    isStandalone,
    deviceType,
    os,
    browser,
    viewportSize
  }
}

// Check if device supports specific features
export const deviceCapabilities = {
  // Camera access
  hasCamera: (): boolean => {
    return typeof navigator !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices
  },

  // Geolocation
  hasGeolocation: (): boolean => {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  },

  // Vibration API
  hasVibration: (): boolean => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
  },

  // Web Share API
  hasWebShare: (): boolean => {
    return typeof navigator !== 'undefined' && 'share' in navigator
  },

  // Payment Request API
  hasPaymentRequest: (): boolean => {
    return typeof window !== 'undefined' && 'PaymentRequest' in window
  },

  // Web Bluetooth
  hasBluetooth: (): boolean => {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  },

  // Clipboard API
  hasClipboard: (): boolean => {
    return typeof navigator !== 'undefined' && 
      'clipboard' in navigator && 
      'writeText' in navigator.clipboard
  },

  // File System Access API
  hasFileSystem: (): boolean => {
    return typeof window !== 'undefined' && 'showOpenFilePicker' in window
  },

  // Device Memory
  getDeviceMemory: (): number | undefined => {
    // @ts-ignore - Experimental API
    return navigator?.deviceMemory
  },

  // Network Connection
  getConnection: (): any => {
    // @ts-ignore - Experimental API
    return navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection
  }
}

// Mobile-specific optimizations
export const mobileOptimizations = {
  // Disable text selection on touch devices for better UX
  disableTextSelection: (element: HTMLElement) => {
    if (deviceCapabilities.hasVibration()) {
      // @ts-ignore - webkit properties not always in TypeScript definitions
      element.style.webkitUserSelect = 'none'
      element.style.userSelect = 'none'
      // @ts-ignore - webkitTouchCallout is not in TypeScript definitions but exists on iOS
      element.style.webkitTouchCallout = 'none'
    }
  },

  // Enable smooth scrolling
  enableSmoothScrolling: () => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth'
    }
  },

  // Prevent zoom on input focus (iOS Safari)
  preventInputZoom: () => {
    if (typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="viewport"]')
      if (meta) {
        meta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        )
      }
    }
  },

  // Add iOS safe area support
  addSafeAreaSupport: () => {
    if (typeof document !== 'undefined' && getDeviceInfo().isIOS) {
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        'env(safe-area-inset-top, 0px)'
      )
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        'env(safe-area-inset-bottom, 0px)'
      )
    }
  }
}

// Performance monitoring for mobile devices
export const mobilePerformance = {
  // Measure paint timing
  getPaintTimings: () => {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      return performance.getEntriesByType('paint')
    }
    return []
  },

  // Check if device is low-end based on various factors
  isLowEndDevice: (): boolean => {
    const deviceInfo = getDeviceInfo()
    const connection = deviceCapabilities.getConnection()
    const deviceMemory = deviceCapabilities.getDeviceMemory()

    // Indicators of low-end device
    const hasSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g'
    )
    const hasLowMemory = deviceMemory && deviceMemory < 4
    const hasOldBrowser = typeof CSS === 'undefined' || !CSS.supports('display', 'grid')

    return !!(hasSlowConnection || hasLowMemory || hasOldBrowser)
  },

  // Get network information
  getNetworkInfo: () => {
    const connection = deviceCapabilities.getConnection()
    if (!connection) return null

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
}

// Mobile-specific event handlers
export const mobileEvents = {
  // Handle orientation change
  onOrientationChange: (callback: (orientation: string) => void) => {
    if (typeof window !== 'undefined') {
      const handleOrientationChange = () => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
        callback(orientation)
      }

      window.addEventListener('orientationchange', handleOrientationChange)
      window.addEventListener('resize', handleOrientationChange)

      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange)
        window.removeEventListener('resize', handleOrientationChange)
      }
    }
  },

  // Handle app state changes
  onVisibilityChange: (callback: (visible: boolean) => void) => {
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        callback(!document.hidden)
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  },

  // Handle battery status
  onBatteryChange: (callback: (battery: any) => void) => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // @ts-ignore - Experimental API
      navigator.getBattery().then((battery: any) => {
        const updateBattery = () => callback(battery)
        
        battery.addEventListener('chargingchange', updateBattery)
        battery.addEventListener('levelchange', updateBattery)
        
        updateBattery()
      })
    }
  }
}

// Utility to adapt content based on device
export const adaptForDevice = (deviceInfo?: DeviceInfo) => {
  const info = deviceInfo || getDeviceInfo()
  
  return {
    // Recommended image sizes based on device
    getImageSizes: () => {
      if (info.isMobile) return '(max-width: 767px) 100vw, 50vw'
      if (info.isTablet) return '(max-width: 1023px) 50vw, 33vw'
      return '(max-width: 1279px) 33vw, 25vw'
    },

    // Recommended lazy loading strategy
    getLazyLoadingStrategy: () => {
      if (mobilePerformance.isLowEndDevice()) return 'eager-minimal'
      if (info.isMobile) return 'progressive'
      return 'standard'
    },

    // Animation preferences
    getShouldReduceMotion: () => {
      return typeof window !== 'undefined' && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },

    // Touch target size recommendations
    getTouchTargetSize: () => {
      if (info.isMobile) return 'min-h-[44px] min-w-[44px]' // iOS HIG
      if (info.isTablet) return 'min-h-[48px] min-w-[48px]'
      return 'min-h-[40px] min-w-[40px]'
    }
  }
}