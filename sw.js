// Change this version number (e.g., 'v2', 'v3') to force an update
const CACHE_NAME = 'joses-toolbox-v2'; 

const ASSETS_TO_CACHE = [
    './',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
    // Add new tools here as you build them
];

// 1. Install Event: Save the files to the phone
self.addEventListener('install', (event) => {
    // Skip the "waiting" lifecycle phase so the new worker takes over immediately
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event: Clean up old versions of the cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If the cache name doesn't match the current version, delete it
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch Event: Intercept network requests and serve from cache first
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return the cached version if found, otherwise go to the network
            return response || fetch(event.request);
        })
    );
});
