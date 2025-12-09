// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Como você vai usar domínio custom (www.admin.center.appsy.app.br),
  // o base pode ser "/"
  base: "/",

  plugins: [react()],

  server: {
    proxy: {
      // DEV ONLY: em produção (GitHub Pages) isso aqui não existe,
      // quem aponta pro backend é o próprio domínio do backend
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
    },
  },
});
