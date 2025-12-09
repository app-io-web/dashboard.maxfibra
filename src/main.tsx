// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";   // 👈 troquei aqui!
import App from "./App";

import "./index.css";
import "./styles_inboard/DynamicPhrase.css";
import "./styles_inboard/TextEffects.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>        {/* 👈 e aqui também */}
      <App />
    </HashRouter>
  </React.StrictMode>
);

// Registro do Service Worker para push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("[SW] Registrado com sucesso:", registration.scope);
      })
      .catch((err) => {
        console.error("[SW] Erro ao registrar Service Worker:", err);
      });
  });
}
