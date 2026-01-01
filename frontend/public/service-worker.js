// Cristoj Bookmarks - Service Worker
// Handles PWA installation, caching, and Share Target API

const CACHE_NAME = 'bookmarks-v4';
const OFFLINE_URL = '/';

// Files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/bookmark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle share target and network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target API (POST)
  if (url.pathname === '/share-target' && event.request.method === 'POST') {

    event.respondWith(
      (async () => {
        // Extract shared data from form data
        const formData = await event.request.formData();
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        let sharedUrl = formData.get('url') || '';


        // Some browsers send URL in 'text' field instead of 'url'
        // If url is empty but text looks like a URL, use text as the URL
        if (!sharedUrl && text) {
          // Check if text is a URL
          if (text.startsWith('http://') || text.startsWith('https://')) {
            sharedUrl = text;
          }
        }


        // Build redirect URL with shared data
        const redirectUrl = new URL('/', self.location.origin);
        redirectUrl.searchParams.set('share', 'true');
        if (title) redirectUrl.searchParams.set('title', title);
        if (text && text !== sharedUrl) redirectUrl.searchParams.set('text', text);
        if (sharedUrl) redirectUrl.searchParams.set('url', sharedUrl);


        // Redirect to main app with shared data
        return Response.redirect(redirectUrl.toString(), 303);
      })()
    );
    return;
  }

  // Network-first strategy for API calls
  if (url.origin.includes('firebase') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch((error) => {
        return new Response('Offline - please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }

  // Cache-first strategy for assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Only cache HTTP/HTTPS requests (ignore chrome-extension://, etc.)
        const requestUrl = new URL(event.request.url);
        if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
