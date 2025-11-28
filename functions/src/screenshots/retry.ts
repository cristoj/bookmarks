/**
 * Cloud Function scheduled para reintentar screenshots fallidos
 *
 * Esta función se ejecuta cada 24 horas para buscar bookmarks
 * con screenshots fallidos y reintentar su captura.
 */

import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/v2";
import {captureScreenshot, type CaptureScreenshotParams} from "./capture";
import type {CallableRequest} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";

/**
 * Cloud Function scheduled para reintentar capturas de screenshots fallidos
 *
 * Se ejecuta cada 24 horas y busca bookmarks con:
 * - screenshotUrl === null (captura fallida o pendiente)
 * - screenshotRetries < 3 (no ha superado el límite de reintentos)
 *
 * Para cada bookmark encontrado (máximo 50), intenta capturar el screenshot.
 * Si la captura falla, incrementa el contador screenshotRetries.
 * Si screenshotRetries alcanza 3, el bookmark no se reintentará más.
 *
 * Esta función ayuda a recuperarse de fallos temporales como:
 * - Timeouts de red
 * - Sitios web temporalmente caídos
 * - Errores transitorios de Cloud Functions
 *
 * @example
 * // Esta función se ejecuta automáticamente cada 24 horas
 * // No necesita ser llamada manualmente
 */
export const retryFailedScreenshots = onSchedule(
  {
    region: "us-central1",
    schedule: "every 24 hours",
    timeoutSeconds: 540, // 9 minutos
    memory: "512MiB",
  },
  async () => {
    logger.info("Iniciando reintento de screenshots fallidos");

    const db = admin.firestore();

    try {
      // Buscar bookmarks con screenshots fallidos
      // Condiciones:
      // 1. screenshotUrl === null (no tiene screenshot)
      // 2. screenshotRetries < 3 (no ha superado el límite)
      // 3. screenshotStatus === 'failed' (marcado como fallido)
      const failedBookmarksQuery = await db
        .collection("bookmarks")
        .where("screenshotUrl", "==", null)
        .where("screenshotStatus", "==", "failed")
        .limit(50)
        .get();

      const count = failedBookmarksQuery.docs.length;
      logger.info(`Encontrados ${count} bookmarks con screenshots fallidos`);

      if (failedBookmarksQuery.docs.length === 0) {
        logger.info("No hay bookmarks para reintentar");
        return;
      }

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      // Procesar cada bookmark
      for (const doc of failedBookmarksQuery.docs) {
        const bookmarkId = doc.id;
        const data = doc.data();

        // Verificar screenshotRetries (puede no existir en bookmarks antiguos)
        const retries = data.screenshotRetries || 0;

        // Si ya ha alcanzado el límite de reintentos, saltar
        if (retries >= 3) {
          logger.warn(
            `Bookmark ${bookmarkId} alcanzó límite de reintentos (${retries})`
          );
          skippedCount++;
          continue;
        }

        logger.info(
          `Reintentando captura para ${bookmarkId} (${retries + 1}/3)`
        );

        try {
          // Incrementar contador de reintentos antes de intentar
          await doc.ref.update({
            screenshotRetries: admin.firestore.FieldValue.increment(1),
            updatedAt: Timestamp.now(),
          });

          // Llamar a captureScreenshot
          // Simular el contexto de autenticación necesario
          const result = await captureScreenshot.run({
            data: {
              bookmarkId,
              url: data.url,
            },
            auth: {
              uid: data.userId,
            },
          } as CallableRequest<CaptureScreenshotParams>);

          if (result.success) {
            logger.info(`Screenshot capturado para ${bookmarkId}`);
            successCount++;
          } else {
            logger.warn(`Captura falló para ${bookmarkId}: ${result.error}`);
            failCount++;
          }
        } catch (error: unknown) {
          const err = error as { message?: string; stack?: string };
          logger.error(
            `Error al reintentar captura para bookmark ${bookmarkId}`,
            {
              error: err.message,
              stack: err.stack,
            }
          );
          failCount++;
        }

        // Pequeña pausa entre capturas para no sobrecargar
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Log del resumen
      logger.info("Reintento de screenshots completado", {
        total: failedBookmarksQuery.docs.length,
        success: successCount,
        failed: failCount,
        skipped: skippedCount,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      logger.error("Error en retryFailedScreenshots", {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }
);
