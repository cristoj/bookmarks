/**
 * Application Configuration
 *
 * Centralized configuration that adapts based on environment.
 * Uses environment variables with sensible defaults.
 */

/**
 * Get the application URL based on environment
 * - Development: Uses VITE_APP_URL or defaults to localhost
 * - Production: Uses VITE_APP_URL or window.location.origin
 */
export function getAppUrl(): string {
  // If explicitly set in env, use that
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  // In development, default to localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }

  // In production, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback (should rarely be used)
  return 'https://bookmarks-app.example.com';
}

/**
 * Application configuration object
 */
export const appConfig = {
  /**
   * Application name
   */
  name: import.meta.env.VITE_APP_NAME || 'Bookmarks App',

  /**
   * Application URL (adapts to environment)
   */
  url: getAppUrl(),

  /**
   * Whether we're in development mode
   */
  isDevelopment: import.meta.env.DEV,

  /**
   * Whether we're in production mode
   */
  isProduction: import.meta.env.PROD,

  /**
   * Whether to use Firebase emulators
   */
  useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
} as const;

/**
 * Build the full URL for a given path
 *
 * @param path - The path to append to the base URL
 * @returns Full URL with the path
 *
 * @example
 * ```ts
 * buildUrl('/bookmarks/123') // => 'http://localhost:5173/bookmarks/123'
 * ```
 */
export function buildUrl(path: string): string {
  const baseUrl = appConfig.url.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get API endpoint URL
 * Useful if you have a separate API server
 *
 * @param endpoint - The API endpoint path
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  const apiBase = import.meta.env.VITE_API_URL || appConfig.url;
  const cleanBase = apiBase.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

export default appConfig;
