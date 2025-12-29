/**
 * Cloud Function para capturar screenshots de bookmarks
 *
 * LÍMITES DEL PLAN GRATUITO DE FIREBASE:
 * - Cloud Functions: 2M invocaciones/mes, 400K GB-segundos/mes, 200K CPU-segundos/mes
 * - Storage: 5GB almacenamiento, 1GB descarga/día
 * - Con memory: '1GB' y timeout: 120s, cada captura consume ~2 GB-segundos
 * - Recomendado: Implementar límite de capturas por usuario/día en producción
 */

import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import {verifyAuth} from "../utils/auth";
import {validateUrl} from "../utils/validation";
import {ALLOWED_ORIGINS} from "../utils/cors";
import {internalCaptureLogic} from "./capture-logic";

/**
 * Interface para los parámetros de captureScreenshot
 */
export interface CaptureScreenshotParams {
  bookmarkId: string;
  url: string;
}

/**
 * Interface para la respuesta de captureScreenshot
 */
export interface CaptureScreenshotResponse {
  success: boolean;
  screenshotUrl?: string;
  error?: string;
}

/**
 * Cloud Function para capturar screenshot de una URL
 *
 * Usa Puppeteer para navegar a la URL y capturar un screenshot,
 * luego lo sube a Firebase Storage y actualiza el bookmark en Firestore
 *
 * IMPORTANTE: Esta función no lanza errores para no bloquear la creación
 * del bookmark. Si falla, actualiza el bookmark con el error.
 *
 * @param request - Request con bookmarkId y url
 * @returns Resultado de la captura con URL del screenshot o error
 *
 * @throws HttpsError si el usuario no está autenticado
 * @throws HttpsError si los parámetros son inválidos
 *
 * @example
 * ```typescript
 * const result = await captureScreenshot({
 *   bookmarkId: "abc123",
 *   url: "https://example.com"
 * });
 * ```
 */
export const captureScreenshot = onCall<CaptureScreenshotParams, Promise<CaptureScreenshotResponse>>(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
    timeoutSeconds: 120,
    memory: "1GiB", // Optimizado para @sparticuz/chromium con viewport pequeño
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    const {bookmarkId, url} = request.data;

    // Validar parámetros
    if (!bookmarkId || typeof bookmarkId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "El ID del bookmark es requerido"
      );
    }

    validateUrl(url);

    const db = admin.firestore();
    const bookmarkRef = db.collection("bookmarks").doc(bookmarkId);

    // Verificar que el bookmark existe y pertenece al usuario
    const bookmarkDoc = await bookmarkRef.get();
    if (!bookmarkDoc.exists) {
      throw new HttpsError("not-found", "El bookmark no existe");
    }

    const bookmarkData = bookmarkDoc.data();
    if (bookmarkData?.userId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permiso para capturar screenshot de este bookmark"
      );
    }

    logger.info(`Iniciando captura de screenshot para bookmark ${bookmarkId}`, {
      url,
      userId,
    });

    // Llamar a la lógica interna de captura
    const result = await internalCaptureLogic({
      bookmarkId,
      url,
      userId,
    });

    return result;
  }
);
