const CACHE_NAME = 'crystal-harbor-v1.0.0'
const OFFLINE_URL = '/offline'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/products',
  '/cart',
  '/account',
  '/auth/login',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js'
]

// Dynamic cache for API responses and images
const API_CACHE_NAME = 'crystal-harbor-api-v1'
const IMAGE_CACHE_NAME = 'crystal-harbor-images-v1'

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      console.log('[SW] Caching static assets')
      
      try {
        await cache.addAll(STATIC_CACHE_URLS)
        console.log('[SW] Static assets cached successfully')
      } catch (error) {
        console.error('[SW] Failed to cache static assets:', error)
        // Cache individually to handle failures gracefully
        for (const url of STATIC_CACHE_URLS) {
          try {
            await cache.add(url)
          } catch (err) {
            console.warn(`[SW] Failed to cache ${url}:`, err)
          }
        }
      }
    })()
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('crystal-harbor-') && name !== CACHE_NAME
      )
      
      await Promise.all(
        oldCaches.map(name => {
          console.log(`[SW] Deleting old cache: ${name}`)
          return caches.delete(name)
        })
      )
      
      // Take control of all clients
      await self.clients.claim()
      console.log('[SW] Service worker activated and controlling all clients')
    })()
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first, cache fallback
    event.respondWith(handleApiRequest(request))
  } else if (request.destination === 'image') {
    // Images - Cache first, network fallback
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname === '/' || url.pathname.startsWith('/products')) {
    // Critical pages - Stale while revalidate
    event.respondWith(handlePageRequest(request))
  } else {
    // Other requests - Network first
    event.respondWith(handleGenericRequest(request))
  }
})

// API requests - Network first with cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', request.url)
    
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline - Unable to fetch data',
        offline: true,
        timestamp: Date.now()
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Image requests - Cache first with network fallback
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request)
    
    // Cache the image if successful
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to load image:', request.url)
    
    // Return placeholder for failed images
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy="0.35em" fill="#9ca3af">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

// Page requests - Stale while revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  
  // Get cached version
  const cachedResponse = await cache.match(request)
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(error => {
    console.log('[SW] Network failed for page:', request.url)
    return null
  })
  
  // Return cached version immediately, or wait for network
  if (cachedResponse) {
    fetchPromise // Update cache in background
    return cachedResponse
  }
  
  const networkResponse = await fetchPromise
  if (networkResponse) {
    return networkResponse
  }
  
  // Fallback to offline page
  return await cache.match(OFFLINE_URL) || new Response(
    'Offline - Page not available',
    { status: 503, headers: { 'Content-Type': 'text/plain' } }
  )
}

// Generic requests - Network first
async function handleGenericRequest(request) {
  try {
    return await fetch(request)
  } catch (error) {
    console.log('[SW] Network failed for generic request:', request.url)
    
    // Try to find cached version
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return basic offline response
    return new Response(
      'Offline - Content not available',
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    )
  }
}

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    console.log('[SW] Background sync triggered for orders')
    event.waitUntil(syncOfflineOrders())
  }
})

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    // Get offline orders from IndexedDB (would need to implement)
    // const offlineOrders = await getOfflineOrders()
    // 
    // for (const order of offlineOrders) {
    //   try {
    //     await submitOrder(order)
    //     await removeOfflineOrder(order.id)
    //   } catch (error) {
    //     console.error('[SW] Failed to sync order:', error)
    //   }
    // }
    
    console.log('[SW] Background sync completed')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications for order updates
self.addEventListener('push', event => {
  console.log('[SW] Push message received')
  
  const options = {
    body: 'Your order status has been updated',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'order-update',
    data: event.data ? event.data.json() : {},
    actions: [
      {
        action: 'view-order',
        title: 'View Order',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    requireInteraction: false,
    silent: false
  }
  
  event.waitUntil(
    self.registration.showNotification('Crystal Harbor Trading', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'view-order') {
    const orderData = event.notification.data
    const orderUrl = orderData.orderUrl || '/account'
    
    event.waitUntil(
      clients.openWindow(orderUrl)
    )
  }
})

console.log('[SW] Service worker script loaded')