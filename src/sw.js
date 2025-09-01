const CACHE_NAME = "hk-lcd-%%CACHE_NAME%%";
const ASSETS = ["./", "./index.html", "./manifest.json", "./sw.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return; // 最小限のガード
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
