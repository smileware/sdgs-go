const CACHE_NAME = 'sustrend-mobile-v4'
const PRECACHE = [
  '/',
  '/index.html',
  '/fonts/GoogleSans-Variable.ttf',
  '/assets/splash-screen.png',
  '/assets/intro-th.png',
  '/assets/intro-en.png',
  '/assets/form-cards.png',
  '/assets/nesdc-logo.png',
  '/assets/sdgs-wheel.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Card artwork is replaced in place, so always revalidate it instead of
  // allowing an old response with the same URL to live in the cache forever.
  if (url.pathname.startsWith('/assets/cards/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => caches.match(event.request)),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
      }
      return response
    })),
  )
})
