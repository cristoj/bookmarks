/**
 * Cloud Function para extraer metadata de una URL
 *
 * Extrae title y description de una página web para autocompletar
 * el formulario de creación de bookmarks.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {load} from "cheerio";
import {request as fetch} from "undici";
import {verifyAuth} from "../utils/auth";
import {validateUrl} from "../utils/validation";

/**
 * Interface para la respuesta de metadata
 */
interface PageMetadata {
  title: string;
  description: string;
  success: boolean;
}

/**
 * Interface para el request
 */
interface MetadataRequest {
  url: string;
}

/**
 * Extrae el título de la página
 * Intenta múltiples métodos en orden de preferencia:
 * 1. Meta tag og:title (Open Graph)
 * 2. Meta tag twitter:title
 * 3. Tag <title>
 *
 * @param $ - Cheerio instance
 * @return El título extraído o string vacío
 */
function extractTitle($: ReturnType<typeof load>): string {
  // Intentar Open Graph title
  let title = $("meta[property=\"og:title\"]").attr("content");
  if (title) return title.trim();

  // Intentar Twitter title
  title = $("meta[name=\"twitter:title\"]").attr("content");
  if (title) return title.trim();

  // Intentar tag <title>
  title = $("title").first().text();
  if (title) return title.trim();

  return "";
}

/**
 * Extrae la descripción de la página
 * Intenta múltiples métodos en orden de preferencia:
 * 1. Meta tag og:description (Open Graph)
 * 2. Meta tag twitter:description
 * 3. Meta tag description
 *
 * @param $ - Cheerio instance
 * @return La descripción extraída o string vacío
 */
function extractDescription($: ReturnType<typeof load>): string {
  // Intentar Open Graph description
  let description = $("meta[property=\"og:description\"]").attr("content");
  if (description) return description.trim();

  // Intentar Twitter description
  description = $("meta[name=\"twitter:description\"]").attr("content");
  if (description) return description.trim();

  // Intentar meta description estándar
  description = $("meta[name=\"description\"]").attr("content");
  if (description) return description.trim();

  return "";
}

/**
 * Cloud Function: getPageMetadata
 *
 * Extrae title y description de una URL proporcionada.
 * Hace un fetch del HTML y parsea las meta tags.
 *
 * @example
 * ```typescript
 * const result = await getPageMetadata({ url: 'https://example.com' });
 * // { title: 'Example Domain', description: 'Example description', success: true }
 * ```
 */
export const getPageMetadata = onCall<MetadataRequest>(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: "https://bookmarks-cristoj.web.app",
  },
  async (request) => {
    // Verificar autenticación
    await verifyAuth(request);

    const {url} = request.data;

    // Validar URL (lanza HttpsError si no es válida)
    validateUrl(url);

    logger.info("Fetching metadata for URL", {url});

    try {
      // Hacer fetch del HTML
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000),
      });

      // Verificar status code
      if (response.statusCode !== 200) {
        logger.warn("Non-200 status code", {
          url,
          statusCode: response.statusCode,
        });
        throw new HttpsError(
          "failed-precondition",
          `Failed to fetch URL. Status code: ${response.statusCode}`
        );
      }

      // Obtener el HTML como texto
      const html = await response.body.text();

      // Parsear HTML con cheerio
      const $ = load(html);

      // Extraer metadata
      const title = extractTitle($);
      const description = extractDescription($);

      logger.info("Metadata extracted successfully", {
        url,
        hasTitle: !!title,
        hasDescription: !!description,
      });

      const result: PageMetadata = {
        title: title || "",
        description: description || "",
        success: true,
      };

      return result;
    } catch (error: any) {
      logger.error("Error fetching metadata", {url, error: error.message});

      // Si es un timeout
      if (error.name === "AbortError" || error.code === "UND_ERR_CONNECT_TIMEOUT") {
        throw new HttpsError(
          "deadline-exceeded",
          "Request timeout. The website took too long to respond."
        );
      }

      // Si es un error de red
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new HttpsError(
          "failed-precondition",
          "Could not connect to the website. Please check the URL."
        );
      }

      // Si ya es un HttpsError, re-lanzarlo
      if (error instanceof HttpsError) {
        throw error;
      }

      // Error genérico
      throw new HttpsError(
        "internal",
        `Failed to fetch metadata: ${error.message}`
      );
    }
  }
);
