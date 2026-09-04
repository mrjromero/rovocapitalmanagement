const CACHE_PREFIX = 'joses-toolbox-';
const CACHE_NAME = `${CACHE_PREFIX}v8`;

const ASSETS_TO_CACHE = [
    './toolbox',
    './toolbox.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png',
    './smart-transfer-workstation',
    './portfolio-visualizer',
    './cfa',
    './ecp',
    './positive-carry-simulator',
    './cashflow-stacker',
    './freedom-date-calc',
    './freedom-date-calc-doc.html'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((cacheName) =>
                            cacheName.startsWith(CACHE_PREFIX) &&
                            cacheName !== CACHE_NAME
                        )
                        .map((cacheName) => caches.delete(cacheName))
                )
            ),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
