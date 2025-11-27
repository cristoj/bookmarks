/**
 * Cloud Function para eliminar bookmarks
 */

import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {verifyAuth} from "../utils/auth";
import {updateTagCounts} from "./helpers";

/**
 * Interface para los parámetros de deleteBookmark
 */
export interface DeleteBookmarkParams {
  bookmarkId: string;
}

/**
 * Interface para la respuesta de deleteBookmark
 */
export interface DeleteBookmarkResponse {
  success: boolean;
  message: string;
}

/**
 * Cloud Function para eliminar un bookmark
 *
 * Verifica ownership, elimina el screenshot de Storage si existe,
 * actualiza el conteo de tags y elimina el documento
 *
 * @param request - Request con el ID del bookmark a eliminar
 * @returns Confirmación de la eliminación
 *
 * @throws HttpsError si el usuario no está autenticado
 * @throws HttpsError si el bookmark no existe
 * @throws HttpsError si el usuario no es el propietario
 *
 * @example
 * ```typescript
 * const result = await deleteBookmark({
 *   bookmarkId: "abc123"
 * });
 * ```
 */
export const deleteBookmark = onCall<DeleteBookmarkParams, Promise<DeleteBookmarkResponse>>(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    const {bookmarkId} = request.data;

    // Validar que se proporcione el bookmarkId
    if (!bookmarkId || typeof bookmarkId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "El ID del bookmark es requerido"
      );
    }

    const db = admin.firestore();
    const bookmarkRef = db.collection("bookmarks").doc(bookmarkId);

    // Verificar que el bookmark existe
    const bookmarkDoc = await bookmarkRef.get();
    if (!bookmarkDoc.exists) {
      throw new HttpsError(
        "not-found",
        "El bookmark no existe"
      );
    }

    // Verificar ownership
    const bookmarkData = bookmarkDoc.data();
    if (bookmarkData?.userId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permiso para eliminar este bookmark"
      );
    }

    // Eliminar screenshot de Storage si existe
    if (bookmarkData.screenshotUrl) {
      try {
        const bucket = admin.storage().bucket();
        const screenshotPath = `screenshots/${userId}/${bookmarkId}.png`;
        const file = bucket.file(screenshotPath);

        // Verificar si el archivo existe antes de intentar eliminarlo
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
        }
      } catch (error) {
        // Log el error pero no fallar la eliminación del bookmark
        console.error("Error al eliminar screenshot:", error);
      }
    }

    // Actualizar conteo de tags
    const tags = bookmarkData.tags || [];
    if (tags.length > 0) {
      await updateTagCounts([], tags);
    }

    // Eliminar el documento
    await bookmarkRef.delete();

    return {
      success: true,
      message: "Bookmark eliminado correctamente",
    };
  }
);
