// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

import "./index.css";
import "./styles_inboard/DynamicPhrase.css";
import "./styles_inboard/TextEffects.css";

// ✅ ADD: SessionProvider
import { SessionProvider } from "./contexts/SessionContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </HashRouter>
  </React.StrictMode>
);

// main.tsx
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
    navigator.serviceWorker
      .register(swUrl)
      .catch((err) => console.error("[SW] Erro ao registrar Service Worker:", err));
  });
}
