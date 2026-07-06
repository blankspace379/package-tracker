// Service Worker for 包裹追踪 PWA
const CACHE_NAME = 'package-tracker-v1.0.0';
const ASSETS = [
    './index.html',
    './manifest.json',
];

// Install - cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 缓存静态资源...');
            return cache.addAll(ASSETS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            // Return cached response, then update cache in background
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Don't cache API responses
                if (event.request.url.includes('kuaidi100.com')) {
                    return networkResponse.clone();
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return networkResponse;
            }).catch(() => {
                // Network failed, return cached version (already handled below)
            });

            return cached || fetchPromise;
        })
    );
});
