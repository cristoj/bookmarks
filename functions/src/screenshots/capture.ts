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
import puppeteer, {Browser, Page} from "puppeteer";
import {v4 as uuidv4} from "uuid";
import {verifyAuth} from "../utils/auth";
import {validateUrl} from "../utils/validation";

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
    timeoutSeconds: 120,
    memory: "1GiB",
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

    let browser: Browser | null = null;

    try {
      logger.info(`Iniciando captura de screenshot para bookmark ${bookmarkId}`, {
        url,
        userId,
      });

      // Actualizar estado a 'processing'
      await bookmarkRef.update({
        screenshotStatus: "processing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Inicializar Puppeteer con configuración para Cloud Functions
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1280x720",
          "--single-process",
          "--no-zygote",
        ],
      });

      const page: Page = await browser.newPage();

      // Configurar viewport
      await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      });

      // Configurar user agent para evitar bloqueos
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      logger.info(`Navegando a ${url}`);

      // Navegar a la URL
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Esperar 2 segundos adicionales para que se cargue contenido dinámico
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logger.info("Capturando screenshot");

      // Capturar screenshot
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      // Cerrar página
      await page.close();

      logger.info("Screenshot capturado, subiendo a Storage");

      // Generar nombre único para el archivo
      const filename = `${uuidv4()}.png`;
      const storagePath = `screenshots/${userId}/${filename}`;

      // Subir a Firebase Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);

      await file.save(screenshot, {
        metadata: {
          contentType: "image/png",
          metadata: {
            bookmarkId,
            capturedAt: new Date().toISOString(),
            userId,
          },
        },
      });

      logger.info("Screenshot subido a Storage, generando URL");

      // Generar signed URL con expiración lejana (10 años)
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 años
      });

      logger.info("URL generada, actualizando Firestore");

      // Actualizar bookmark en Firestore
      await bookmarkRef.update({
        screenshotUrl: signedUrl,
        screenshotPath: storagePath,
        screenshotStatus: "completed",
        screenshotError: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Screenshot capturado exitosamente para bookmark ${bookmarkId}`);

      return {
        success: true,
        screenshotUrl: signedUrl,
      };
    } catch (error: any) {
      // Log detallado del error
      logger.error(`Error al capturar screenshot para bookmark ${bookmarkId}`, {
        error: error.message,
        stack: error.stack,
        url,
        userId,
      });

      // Actualizar bookmark con el error (no lanzar excepción)
      try {
        await bookmarkRef.update({
          screenshotUrl: null,
          screenshotStatus: "failed",
          screenshotError: error.message || "Error desconocido al capturar screenshot",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError: any) {
        logger.error("Error al actualizar estado de error en Firestore", {
          error: updateError.message,
        });
      }

      // Retornar error sin lanzar excepción (no bloquear creación de bookmark)
      return {
        success: false,
        error: error.message || "Error desconocido al capturar screenshot",
      };
    } finally {
      // Cerrar browser siempre
      if (browser) {
        try {
          await browser.close();
          logger.info("Browser cerrado correctamente");
        } catch (closeError: any) {
          logger.error("Error al cerrar browser", {
            error: closeError.message,
          });
        }
      }
    }
  }
);
