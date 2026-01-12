// src/lib/siteApi.ts
import axios from "axios";

export const siteApi = axios.create({
  baseURL: import.meta.env.VITE_CENTRAL_API_URL, // http://localhost:3333
});
