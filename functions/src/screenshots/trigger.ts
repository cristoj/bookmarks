import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { internalCaptureLogic } from "./capture-logic";

/**
 * Cloud Function Trigger para iniciar la captura de screenshot.
 * Se dispara automáticamente tras la creación de un bookmark.
 */
export const onBookmarkCreated = onDocumentCreated(
  {
    document: "bookmarks/{bookmarkId}",
    // Configuración ALTA necesaria para Puppeteer (recomendado 2GB mínimo)
    timeoutSeconds: 120,
    memory: "2GiB",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No hay datos en el evento.");
      return;
    }

    const bookmarkData = snapshot.data();
    const bookmarkId = snapshot.id;
    const url = bookmarkData.url;
    const userId = bookmarkData.userId;
    const status = bookmarkData.screenshotStatus;

    // Ejecutar solo si el estado es 'pending' y tenemos URL
    if (status === "pending" && url && userId) {
        logger.info(`Iniciando lógica de captura (Trigger) para ${bookmarkId}`);
        
        // 🔥 Llama a la lógica de captura con los datos puros
        await internalCaptureLogic({ bookmarkId, url, userId });
        
    } else {
        logger.log(`No se inició la captura para ${bookmarkId}. Estado: ${status}`);
    }
  }
);