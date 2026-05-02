const CACHE_NAME = "curio-conecta-v2";
const APP_SHELL = [
  "/",
  "/avisos",
  "/noticias",
  "/rh/codigo-etica",
  "/rh/cartilha",
  "/rh/politicas",
  "/manifest.json",
  "/logos/curio_app_icon_192.png",
  "/logos/curio_app_icon_512.png",
  "/logos/curio_logo_vermelho.png",
  "/logos/conecta_lockup/conecta_curio_splash_vermelho.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/~oauth")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("/");
        throw new Error("Offline and no cached response available");
      })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || { title: "Conecta Curió", body: "Nova atualização disponível." };
  event.waitUntil(
    self.registration.showNotification(data.title || "Conecta Curió", {
      body: data.body || "Nova atualização disponível.",
      icon: "/logos/curio_app_icon_192.png",
      badge: "/logos/curio_app_icon_192.png",
      data: { url: data.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});