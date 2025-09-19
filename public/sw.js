// Service Worker for Helpr PWA
const CACHE_NAME = 'helpr-v1'
const STATIC_CACHE = 'helpr-static-v1'
const DYNAMIC_CACHE = 'helpr-dynamic-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/verification',
  '/verification/mobile',
  '/privacy',
  '/manifest.json',
  // Add other critical files
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request)
        })
    )
    return
  }

  // Handle page requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((response) => {
            // Don't cache error responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone)
              })

            return response
          })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
  )
})

// Background sync for offline verification submissions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'verification-submission') {
    event.waitUntil(syncVerificationSubmissions())
  }
})

// Push notifications for verification updates
self.addEventListener('push', (event) => {
  console.log('Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Verification update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/verification'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Helpr Verification', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action)
  
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/verification')
    )
  }
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_VERIFICATION') {
    // Cache verification data for offline access
    const { userId, verificationData } = event.data
    cacheVerificationData(userId, verificationData)
  }
})

// Helper function to sync offline verification submissions
async function syncVerificationSubmissions() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = await cache.keys()
    
    const verificationRequests = requests.filter(request => 
      request.url.includes('/api/verification/submit')
    )
    
    for (const request of verificationRequests) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.delete(request)
          console.log('Synced verification submission:', request.url)
        }
      } catch (error) {
        console.error('Failed to sync verification:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper function to cache verification data
async function cacheVerificationData(userId, verificationData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cacheKey = `/verification-data/${userId}`
    
    const response = new Response(JSON.stringify(verificationData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600' // 1 hour
      }
    })
    
    await cache.put(cacheKey, response)
    console.log('Cached verification data for user:', userId)
  } catch (error) {
    console.error('Failed to cache verification data:', error)
  }
}

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag)
  
  if (event.tag === 'verification-status-update') {
    event.waitUntil(updateVerificationStatus())
  }
})

// Helper function to update verification status
async function updateVerificationStatus() {
  try {
    const response = await fetch('/api/verification/status')
    if (response.ok) {
      const data = await response.json()
      
      // Cache updated status
      const cache = await caches.open(DYNAMIC_CACHE)
      await cache.put('/api/verification/status', response.clone())
      
      console.log('Updated verification status')
    }
  } catch (error) {
    console.error('Failed to update verification status:', error)
  }
}
