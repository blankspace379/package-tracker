// Service Worker for 包裹追踪 PWA
const CACHE_NAME = 'package-tracker-v2.0.0';
const ASSETS = [
    './index.html',
    './manifest.json',
];

// Install - cache all assets
self.addEventListener('install', event => {
    console.log('📦 SW v2 installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    console.log('📦 SW v2 activating, cleaning old caches...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch - Network first for HTML, cache first for others
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // For HTML: network first (always get latest), cache fallback
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For other assets: cache first, network fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (!event.request.url.includes('kuaidi100.com')) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return networkResponse;
            }).catch(() => {});

            return cached || fetchPromise;
        })
    );
});
