const CACHE = "meu-diario-v1";
const ASSETS = [
  "/meu-diario/",
  "/meu-diario/index.html",
  "/meu-diario/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Requisições ao Supabase e CDNs sempre vão para a rede
  if (e.request.url.includes("supabase.co") ||
      e.request.url.includes("googleapis.com") ||
      e.request.url.includes("unpkg.com") ||
      e.request.url.includes("cdnjs.cloudflare.com") ||
      e.request.url.includes("jsdelivr.net")) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
