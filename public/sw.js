/* Chrio Life service worker: offline app shell + offline reading of days already opened. */
const VERSION = "chrio-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, fallbackUrl) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(fallbackUrl || req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(fallbackUrl || req);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Admin pages and login traffic are never cached.
  if (url.pathname.startsWith("/auth/")) return;

  // Page navigations: try the network, fall back to the cached app shell.
  if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, "/index.html"));
    return;
  }
  // Built assets and fonts never change once published.
  if ((url.origin === location.origin && url.pathname.startsWith("/assets/")) ||
      url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) {
    e.respondWith(cacheFirst(req));
    return;
  }
  // Devotional reads from Supabase: fresh when online, last copy when offline.
  if (url.pathname.startsWith("/rest/v1/devotionals")) {
    e.respondWith(networkFirst(req));
    return;
  }
  if (url.origin === location.origin) e.respondWith(networkFirst(req));
});
