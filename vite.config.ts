// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // ✅ garante que React/ReactDOM não “duplicam por caminho”
    dedupe: ["react", "react-dom"],
  },

  // ✅ ajuda o prebundle do Vite a não fazer magia negra
  optimizeDeps: {
    include: ["react", "react-dom"],
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4200",
        changeOrigin: true,
        secure: false,
      },
      "/notifications": {
        target: "http://localhost:4200",
        changeOrigin: true,
        secure: false,
      },
      "/site-api": {
        target: "http://localhost:3333",
        changeOrigin: true,
        secure: false,
        // sem rewrite
      },

    },
  },
});
