// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Depois você pode separar em arquivos JSON, aqui é só exemplo
const resources = {
  "pt-BR": {
    translation: {
      "dashboard.title": "Visão geral",
      "dashboard.subtitle":
        "Aqui depois a gente mostra cards com status de servidores, serviços, aniversariantes de hoje, etc.",
      "userSettings.title": "Configurações do usuário",
    },
  },
  en: {
    translation: {
      "dashboard.title": "Overview",
      "dashboard.subtitle":
        "Here we will later show cards with server status, services, today birthdays, etc.",
      "userSettings.title": "User settings",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  // idioma padrão enquanto ainda não carregou o do usuário
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
