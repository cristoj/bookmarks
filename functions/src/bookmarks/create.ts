/**
 * Cloud Function para crear bookmarks
 */

import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {verifyAuth} from "../utils/auth";
import {validateBookmarkData, BookmarkData} from "../utils/validation";
import {updateTagCounts} from "./helpers";

/**
 * Interface para la respuesta de createBookmark
 */
export interface CreateBookmarkResponse {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cloud Function para crear un nuevo bookmark
 *
 * Valida los datos, crea el documento en Firestore,
 * actualiza el conteo de tags y dispara la captura de screenshot
 *
 * @param request - Request con los datos del bookmark
 * @returns El bookmark creado con su ID
 *
 * @throws HttpsError si el usuario no está autenticado
 * @throws HttpsError si los datos no son válidos
 *
 * @example
 * ```typescript
 * const result = await createBookmark({
 *   url: "https://example.com",
 *   title: "Example Site",
 *   description: "A great example",
 *   tags: ["example", "web"]
 * });
 * ```
 */
export const createBookmark = onCall<BookmarkData, Promise<CreateBookmarkResponse>>(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    // Validar datos del bookmark
    const data = request.data;
    validateBookmarkData(data);

    // Verificar que title esté presente (es requerido)
    if (!data.title || data.title.trim().length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "El título es requerido"
      );
    }

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Preparar datos del bookmark
    const bookmarkData = {
      url: data.url,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      tags: data.tags || [],
      folderId: data.folderId || null,
      userId,
      screenshotUrl: null,
      screenshotStatus: "pending" as const,
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Crear el documento
    const bookmarkRef = await db.collection("bookmarks").add(bookmarkData);

    // Actualizar conteo de tags
    if (bookmarkData.tags.length > 0) {
      await updateTagCounts(bookmarkData.tags, []);
    }

    // NOTA: La captura de screenshot debe implementarse de una de estas formas:
    //
    // Opción 1 (Recomendada): Usar un trigger de Firestore
    // En functions/src/screenshots/trigger.ts:
    //   export const onBookmarkCreated = onDocumentCreated(
    //     "bookmarks/{bookmarkId}",
    //     async (event) => {
    //       const data = event.data?.data();
    //       if (data?.screenshotStatus === "pending") {
    //         // Llamar a captureScreenshot manualmente
    //       }
    //     }
    //   );
    //
    // Opción 2: Usar Cloud Tasks para encolar la captura
    //   const tasksClient = new CloudTasksClient();
    //   await tasksClient.createTask({...});
    //
    // Opción 3: El cliente llama a captureScreenshot después de crear el bookmark
    //   await createBookmark(data);
    //   await captureScreenshot(result.id, data.url);
    //
    // Por ahora, el cliente debe llamar manualmente a captureScreenshot

    // Retornar el bookmark creado
    return {
      id: bookmarkRef.id,
      url: bookmarkData.url,
      title: bookmarkData.title,
      description: bookmarkData.description,
      tags: bookmarkData.tags,
      folderId: bookmarkData.folderId || undefined,
      userId: bookmarkData.userId,
      createdAt: bookmarkData.createdAt.toDate().toISOString(),
      updatedAt: bookmarkData.updatedAt.toDate().toISOString(),
    };
  }
);
