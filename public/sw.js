// ── CACHE VERSION — bump this to force SW update on next deploy ──
const SW_VERSION = "1";

const SUPABASE_ORIGIN = "https://bfkjimqsznebqhtqwafo.supabase.co";

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.4.0/workbox-sw.js");

if (workbox) {
  workbox.core.clientsClaim();
  workbox.core.skipWaiting();

  // ── Precache the offline fallback page ──
  workbox.precaching.precacheAndRoute([
    { url: "/offline.html", revision: SW_VERSION },
  ]);

  // ── Supabase menu data (categories & items) ──
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === SUPABASE_ORIGIN &&
      (url.pathname.startsWith("/rest/v1/categories") ||
        url.pathname.startsWith("/rest/v1/items")),
    new workbox.strategies.NetworkFirst({
      cacheName: "supabase-menu-data",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
      networkTimeoutSeconds: 5,
    }),
    "GET"
  );

  // ── Supabase storage images ──
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === SUPABASE_ORIGIN && url.pathname.startsWith("/storage/v1/"),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "supabase-storage",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ── Images ──
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ── Static assets (scripts, styles, fonts) ──
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "static-resources",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ── Navigation fallback → offline page on failed navigations ──
  const offlineFallback = new workbox.routing.NavigationRoute(
    new workbox.strategies.NetworkOnly({
      plugins: [
        {
          handlerDidError: async () => {
            const cache = await caches.open(workbox.core.cacheNames.precache);
            const response = await cache.match("/offline.html");
            return response || Response.error();
          },
        },
      ],
    })
  );
  workbox.routing.registerRoute(offlineFallback);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
