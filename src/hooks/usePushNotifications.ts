// src/hooks/usePushNotifications.ts
import { useEffect } from "react";
import { api } from "../lib/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  useEffect(() => {
    async function setupPush() {
      // 1. Verificações básicas
      if (!VAPID_PUBLIC_KEY) {
        console.warn("VITE_WEB_PUSH_PUBLIC_KEY não configurada → push desativado");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Este navegador não suporta Push Notifications");
        return;
      }

      try {
        // 2. Registra o Service Worker (tem que estar em public/sw.js!)
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        await navigator.serviceWorker.ready;
        console.log("Service Worker registrado com sucesso");

        // 3. Verifica permissão atual
        if (Notification.permission === "denied") {
          console.warn("Notificações bloqueadas pelo usuário");
          return;
        }

        if (Notification.permission === "default") {
          console.log("Pedindo permissão para notificações...");
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            console.warn("Permissão de notificação negada:", permission);
            return;
          }
        }

        // 4. Pega ou cria a subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          console.log("Criando nova subscription...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          console.log("Nova subscription criada!");
        } else {
          console.log("Subscription já existe, reutilizando...");
        }

        console.log("Endpoint:", subscription.endpoint);

        // 5. Envia pro backend (idempotente graças ao ON CONFLICT)
        await api.post("/notifications/subscribe", { subscription });
        console.log("Subscription sincronizada com o backend com sucesso!");

      } catch (err: any) {
        console.error("Erro crítico no setup de push:", err);
        if (err.name === "NotAllowedError") {
          console.warn("Usuário bloqueou notificações");
        }
      }
    }

    setupPush();
  }, []); // roda só uma vez quando o Dashboard monta (perfeito!)
}