/**
 * RainStop • Production Service Worker (v4)
 * Network-first strategy: Always fetch live freshest assets; fall back to cache when offline.
 */

const CACHE_NAME = 'rainstop-cache-v13';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  // Never cache live weather / cyclone data or map tiles: they must be fresh, and radar/satellite
  // frames have unique URLs that would pile up in the cache forever. Basemap tiles are
  // left to the browser's HTTP cache. (The app keeps its own short-lived forecast cache
  // in localStorage.)
  const host = new URL(event.request.url).hostname;
  if (/(^|\.)open-meteo\.com$|(^|\.)rainviewer\.com$|(^|\.)gibs\.earthdata\.nasa\.gov$|(^|\.)tile\.openstreetmap\.org$|(^|\.)gdacs\.org$/.test(host)) return;
  // Always try Network First for everything to prevent stale code or old times
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
