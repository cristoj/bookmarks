/**
 * Cloud Function temporal para arreglar las URLs firmadas
 */

import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

export const fixScreenshotUrls = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (req, res) => {
    logger.info("Iniciando actualización de URLs de screenshots");

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    try {
      // Obtener todos los bookmarks
      const snapshot = await db.collection("bookmarks").get();

      logger.info(`Encontrados ${snapshot.size} bookmarks`);

      let updatedCount = 0;
      let skippedCount = 0;

      let batch = db.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const screenshotUrl = data.screenshotUrl;

        // Si no tiene screenshotUrl o no tiene screenshotPath, saltar
        if (!screenshotUrl || !data.screenshotPath) {
          skippedCount++;
          continue;
        }

        // Si la URL contiene "Expires" o "Signature", es una signed URL
        if (screenshotUrl.includes("Expires") || screenshotUrl.includes("Signature") || screenshotUrl.includes("GoogleAccessId")) {
          // Generar URL pública simple
          const encodedPath = encodeURIComponent(data.screenshotPath);
          const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

          // Agregar al batch
          batch.update(doc.ref, {screenshotUrl: newUrl});
          batchCount++;
          updatedCount++;

          // Firestore batch limit es 500
          if (batchCount >= 500) {
            await batch.commit();
            logger.info(`Batch commit: ${batchCount} actualizados`);
            batch = db.batch(); // Crear nuevo batch
            batchCount = 0;
          }
        } else {
          skippedCount++;
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        logger.info(`Batch final commit: ${batchCount} actualizados`);
      }

      const result = {
        success: true,
        total: snapshot.size,
        updated: updatedCount,
        skipped: skippedCount,
      };

      logger.info("Proceso completado", result);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error actualizando URLs", {error});
      res.status(500).json({
        success: false,
        error: String(error),
      });
    }
  }
);
