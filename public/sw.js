// theCollectorHQ service worker.
// Pages always come from the network so collections, prices and sign-in are never stale;
// only the offline page, icons, built files and the latest Show mode page are cached. Bump VERSION when this file changes.
const VERSION = "chq-v3";
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Show mode: network first, and keep the latest copy so it still opens at a show with no signal.
  if (req.mode === "navigate" && url.pathname === "/show-mode") {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("/show-mode", copy)); }
        return res;
      }).catch(() => caches.match("/show-mode").then((hit) => hit || caches.match(OFFLINE))),
    );
    return;
  }

  // Page loads: network first, the offline page if there's no connection.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Built files and icons never change at the same address, so serve them from the cache once seen.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
