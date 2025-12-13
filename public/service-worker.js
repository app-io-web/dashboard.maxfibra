// public/service-worker.js

// Versão do SW (muda isso quando fizer mudança grande no cache)
const SW_VERSION = "central-admin-v3"; // <<-- bump pra forçar tudo a atualizar
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

// ACTIVATE: limpa caches antigos + assume controle + avisa o app
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");

  event.waitUntil(
    (async () => {
      // 1) limpa caches antigos (mantém só o atual)
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deletando cache antigo:", key);
            return caches.delete(key);
          }
        })
      );

      // 2) assume controle das abas abertas
      await self.clients.claim();

      // 3) avisa o app que o SW novo foi ativado
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      console.log("[SW] Avisando clients:", clientList.length);

      for (const client of clientList) {
        client.postMessage({
          source: "sw",
          type: "SW_ACTIVATED",
          version: SW_VERSION,
        });
      }
    })()
  );
});


self.addEventListener("fetch", (event) => {
  const request = event.request;

  // só GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";

  // 1) NÃO intercepta requisições de outro domínio
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2) NÃO mexer em:
  // - chamadas de API (/api)
  // - notificações (/notifications)
  // - rotas de auth (/auth, /login, /me)
  // - qualquer coisa que peça JSON (Accept: application/json)
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/notifications") ||
    url.pathname.startsWith("/auth") ||
    url.pathname === "/login" ||
    url.pathname === "/me" ||
    acceptHeader.includes("application/json")
  ) {
    return;
  }

  // 3) Navegação SPA: SEMPRE responder com index.html
  if (request.mode === "navigate" && acceptHeader.includes("text/html")) {
    event.respondWith(
      (async () => {
        // tenta pegar do cache primeiro
        const cachedIndex = await caches.match("/index.html");
        if (cachedIndex) {
          return cachedIndex;
        }

        // se não tiver no cache, busca da rede e salva
        const response = await fetch("/index.html");
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put("/index.html", response.clone());
        } catch (err) {
          console.warn("[SW] Erro ao cachear index.html:", err);
        }
        return response;
      })()
    );
    return;
  }

  // 4) Demais recursos estáticos: cache first com fallback pra rede
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());

        return response;
      } catch (err) {
        console.warn("[SW] Fetch falhou, talvez offline:", err);

        // tenta de novo o cache desse request
        const fallbackCache = await caches.match(request);
        if (fallbackCache) return fallbackCache;

        // se for navegação e não tiver nada, tenta index.html
        if (request.mode === "navigate") {
          const fallbackIndex = await caches.match("/index.html");
          if (fallbackIndex) return fallbackIndex;
        }

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


// Recebe comandos do app (ex: forçar ativação / limpar cache)
self.addEventListener("message", (event) => {
  const msg = event.data || {};

  if (msg?.type === "SKIP_WAITING") {
    console.log("[SW] SKIP_WAITING recebido");
    self.skipWaiting();
    return;
  }

  if (msg?.type === "CLEAR_CACHES") {
    console.log("[SW] CLEAR_CACHES recebido");

    event.waitUntil(
      (async () => {
        const keys = await caches.keys();

        // 🔥 RECOMENDADO: apagar só caches da tua app (não tudo do domínio)
        await Promise.all(
          keys.map((k) => {
            if (k.startsWith("central-admin-cache-")) {
              console.log("[SW] Limpando cache:", k);
              return caches.delete(k);
            }
          })
        );
      })()
    );

    return;
  }
});

