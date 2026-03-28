/* global self, caches, clients */
/**
 * Qalbee PWA service worker — updates, safe static caching, Web Push.
 * Bump CACHE_VERSION when changing caching behavior so clients refresh.
 */
const CACHE_VERSION = "qalbee-v3";
const STATIC_CACHE = `qalbee-static-${CACHE_VERSION}`;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", () => {
  // Do not call skipWaiting here so updates wait until user confirms (see SwUpdatePrompt).
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("qalbee-static-") && k !== STATIC_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const path = url.pathname;
  const isStatic =
    path.startsWith("/_next/static/") ||
    path.startsWith("/_next/image") ||
    path === "/manifest.webmanifest" ||
    path.endsWith(".woff2") ||
    path.endsWith(".woff") ||
    /\.(?:png|svg|ico|jpg|jpeg|webp)$/i.test(path);

  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      const response = await fetch(req);
      if (response.ok) {
        cache.put(req, response.clone());
      }
      return response;
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Qalbee",
    body: "You have a new notification.",
    url: "/notifications",
  };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      try {
        const t = event.data.text();
        if (t) data = { ...data, body: t };
      } catch {
        /* ignore */
      }
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons_and_manifest/icon-192.png",
      badge: "/icons_and_manifest/icon-192.png",
      data: { url: data.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  const fullUrl = new URL(url, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(fullUrl);
    }),
  );
});
