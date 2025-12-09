// public/service-worker.js

// Versão do SW (muda isso quando fizer mudança grande no cache)
const SW_VERSION = "central-admin-v2"; // <<-- bump pra forçar tudo a atualizar
const CACHE_NAME = `central-admin-cache-${SW_VERSION}`;

console.log("[SW] Versão carregada:", SW_VERSION);

// Arquivos básicos para pré-cache (app shell)
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// INSTALL: precache básico
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Fazendo precache de:", PRECACHE_URLS);
        return cache.addAll(PRECACHE_URLS);
      })
      .catch((err) => {
        console.warn("[SW] Erro no precache:", err);
      })
  );

  self.skipWaiting();
});

// ACTIVATE: limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deletando cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // só GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";

  // ============================
  // NUNCA MEXER EM:
  // - chamadas de API (/api)
  // - notificações
  // - rotas de auth (/auth, /login, /me)
  // - qualquer coisa que peça JSON (Accept: application/json)
  // ============================
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/notifications") ||
    url.pathname.startsWith("/auth") ||
    url.pathname === "/login" ||
    url.pathname === "/me" ||
    acceptHeader.includes("application/json")
  ) {
    // deixa passar direto pro network, sem cache especial
    return;
  }

  event.respondWith(
    (async () => {
      // 1) tenta cache primeiro
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      try {
        // 2) tenta rede
        const response = await fetch(request);

        // só cacheia se for 200 "normal"
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());

        return response;
      } catch (err) {
        console.warn("[SW] Fetch falhou, talvez offline:", err);

        // 3) fallback pra navegação SPA
        if (request.mode === "navigate") {
          const fallbackIndex = await caches.match("/index.html");
          if (fallbackIndex) return fallbackIndex;
        }

        // 4) tenta de novo o cache desse request
        const fallbackCache = await caches.match(request);
        if (fallbackCache) return fallbackCache;

        // 5) ÚLTIMO RECURSO: devolve SEMPRE uma Response válida
        return new Response("Offline ou servidor indisponível.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })()
  );
});

// =======================
// PUSH NOTIFICATIONS
// =======================

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    console.error("[SW] Erro ao parsear payload de push:", err);
  }

  console.log("[SW] Push recebido com data:", data);

  const title = data.title || "Nova notificação";
  const body = data.body || "";
  const url = data.url || "/";

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url,
      raw: data,
    },
  };

  const showNotificationPromise = self.registration.showNotification(
    title,
    options
  );

  const broadcastPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      console.log("[SW] Enviando mensagem para", clientList.length, "clients");
      for (const client of clientList) {
        client.postMessage({
          source: "web-push",
          title,
          body,
          url,
          data: data.data || {},
        });
      }
    });

  event.waitUntil(Promise.all([showNotificationPromise, broadcastPromise]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if (url) {
              client.navigate(url);
            }
            return;
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url || "/");
        }
      })
  );
});
