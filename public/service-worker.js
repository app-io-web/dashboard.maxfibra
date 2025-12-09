// public/service-worker.js

const SW_VERSION = "fichas-v2";
console.log("[SW] Versão carregada:", SW_VERSION);

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
    icon: "/icon-192.png",
    badge: "/icon-96.png",
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
          data: data.data || {}, // aqui vai { type: "cadastro_ficha", protocolo, ... }
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
