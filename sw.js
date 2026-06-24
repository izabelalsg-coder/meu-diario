// Incrementar a versão sempre que atualizar o app
const CACHE_VERSION = "meu-diario-v3";
const STATIC_CACHE  = CACHE_VERSION + "-static";

// Recursos que ficam em cache (fontes, ícones — mudam raramente)
const PRECACHE = [
  "/meu-diario/manifest.json"
];

// Domínios que nunca devem ser interceptados (Supabase e CDNs)
const BYPASS_DOMAINS = [
  "supabase.co",
  "googleapis.com",
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "jsdelivr.net",
  "fonts.gstatic.com",
];

// ── INSTALL: faz cache dos recursos estáticos ─────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpa caches antigos ───────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: estratégia por tipo de recurso ─────────────────────
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Deixa passar sem interceptar: Supabase, CDNs externos
  if (BYPASS_DOMAINS.some(d => url.includes(d))) return;

  // index.html → REDE PRIMEIRO, cache como fallback
  // Garante sempre a versão mais recente ao abrir o app
  if (url.endsWith("/meu-diario/") || url.endsWith("/meu-diario/index.html") || url.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache com a versão mais recente
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // manifest.json e outros → CACHE PRIMEIRO
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
