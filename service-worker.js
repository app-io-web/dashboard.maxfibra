// public/service-worker.js

// Versão do SW (muda isso quando fizer mudança grande no cache)
const SW_VERSION = "central-admin-v1";
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

// FETCH: cache-first para assets, network para API
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // só GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não cacheia chamadas de API ou notificações
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/notifications")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // senão, busca na rede e guarda no cache
      return fetch(request)
        .then((response) => {
          // só cacheia resposta ok
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch((err) => {
          console.warn("[SW] Fetch falhou, talvez offline:", err);

          // se for navegação, tentar voltar pro index.html (SPA)
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // senão, tenta algo básico
          return caches.match(request);
        });
    })
  );
});


// =======================
// PUSH NOTIFICATIONS
// (sua lógica original + ajustes de ícone)
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
    // ícones alinhados com o que colocamos na pasta /icons
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url,
      raw: data,
    },
  };

  // 1) mostra a notificação normal
  const showNotificationPromise = self.registration.showNotification(
    title,
    options
  );

  // 2) avisa as abas abertas
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
          data: data.data || {}, // { type: "cadastro_ficha", protocolo, ... }
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
