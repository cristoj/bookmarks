/**
 * Configuración CORS centralizada para Cloud Functions
 */

/**
 * Orígenes permitidos para CORS
 * Incluye dominios de producción y puertos comunes de localhost para desarrollo
 */
export const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://bookmarks-cristoj.web.app",
  "https://bookmarks-cristoj.firebaseapp.com",
  "http://localhost:5173", // Vite dev server (puerto por defecto)
  "http://localhost:3000", // Puerto alternativo común
  "http://localhost:4000", // Firebase emulator UI
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
];
