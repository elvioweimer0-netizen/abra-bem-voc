// Curió Conecta — Service Worker com suporte a modo offline básico
const STATIC_CACHE = "curio-static-v3";
const DATA_CACHE = "curio-data-v3";
const HTML_CACHE = "curio-html-v3";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/logos/curio_app_icon_192.png",
  "/logos/curio_app_icon_512.png",
  "/logos/curio_logo_vermelho.png",
  "/logos/conecta_lockup/conecta_curio_splash_vermelho.png",
];

// Allowlist de tabelas Supabase REST (GET) que podem ser cacheadas offline.
// Mantém fora de cache: HR sensível, churn, rh, payroll, etc.
const REST_ALLOWLIST = [
  "avisos",
  "aviso_reads",
  "profiles",
  "checklist_items",
  "checklist_templates",
  "units",
  "team_members",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, DATA_CACHE, HTML_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)(\?|$)/.test(url.pathname) || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/logos/");
}

function isSupabaseRestGet(url, request) {
  if (request.method !== "GET") return false;
  if (!url.pathname.startsWith("/rest/v1/")) return false;
  const table = url.pathname.split("/")[3]?.split("?")[0];
  return REST_ALLOWLIST.includes(table);
}

async function networkFirstHtml(request) {
  try {
    const fresh = await Promise.race([
      fetch(request),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
    const cache = await caches.open(HTML_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/~oauth")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstHtml(request));
    return;
  }
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isSupabaseRestGet(url, request)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }
  // Default: network only (deixa passar)
});

self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_CACHES") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || { title: "Conecta Curió", body: "Nova atualização disponível." };
  const silent = data.silent === true;
  const tag = data.tag || data.grouping_key || undefined;
  event.waitUntil(
    self.registration.showNotification(data.title || "Conecta Curió", {
      body: data.body || "Nova atualização disponível.",
      icon: "/logos/curio_app_icon_192.png",
      badge: "/logos/curio_app_icon_192.png",
      silent,
      tag,
      renotify: !silent && !!tag,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
