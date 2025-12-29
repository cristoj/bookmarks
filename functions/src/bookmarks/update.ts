/**
 * Cloud Function para actualizar bookmarks
 */

import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import {verifyAuth} from "../utils/auth";
import {updateTagCounts} from "./helpers";
import {Timestamp} from "firebase-admin/firestore";
import {ALLOWED_ORIGINS} from "../utils/cors";

/**
 * Interface para los parámetros de updateBookmark
 */
export interface UpdateBookmarkParams {
  bookmarkId: string;
  title?: string;
  description?: string;
  tags?: string[];
  folderId?: string | null;
  screenshotUrl?: string | null;
}

/**
 * Interface para la respuesta de updateBookmark
 */
export interface UpdateBookmarkResponse {
  success: boolean;
  message: string;
}

/**
 * Cloud Function para actualizar un bookmark existente
 *
 * Verifica ownership, actualiza los campos permitidos y
 * actualiza el conteo de tags
 *
 * @param request - Request con los datos a actualizar
 * @returns Confirmación de la actualización
 *
 * @throws HttpsError si el usuario no está autenticado
 * @throws HttpsError si el bookmark no existe
 * @throws HttpsError si el usuario no es el propietario
 * @throws HttpsError si los datos no son válidos
 *
 * @example
 * ```typescript
 * const result = await updateBookmark({
 *   bookmarkId: "abc123",
 *   title: "New Title",
 *   tags: ["updated", "tags"]
 * });
 * ```
 */
export const updateBookmark = onCall<
  UpdateBookmarkParams,
  Promise<UpdateBookmarkResponse>
>(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    const {bookmarkId, title, description, tags, folderId, screenshotUrl} = request.data;

    // Log para debug
    logger.info("updateBookmark - Datos recibidos", {
      bookmarkId,
      hasScreenshotUrl: screenshotUrl !== undefined,
      screenshotUrl,
      allData: request.data,
    });

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
        "No tienes permiso para modificar este bookmark"
      );
    }

    // Preparar datos de actualización
    const updateData: {
      updatedAt: admin.firestore.FieldValue;
      title?: string;
      description?: string;
      tags?: string[];
      folderId?: string | null;
      screenshotUrl?: string | null;
      screenshotStatus?: string;
    } = {
      updatedAt: Timestamp.now(),
    };

    // Validar y agregar campos opcionales
    if (title !== undefined) {
      if (typeof title !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "El título debe ser una cadena de texto"
        );
      }
      if (title.trim().length === 0) {
        throw new HttpsError(
          "invalid-argument",
          "El título no puede estar vacío"
        );
      }
      if (title.length > 500) {
        throw new HttpsError(
          "invalid-argument",
          "El título es demasiado largo (máximo 500 caracteres)"
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "La descripción debe ser una cadena de texto"
        );
      }
      if (description.length > 2000) {
        throw new HttpsError(
          "invalid-argument",
          "La descripción es demasiado larga (máximo 2000 caracteres)"
        );
      }
      updateData.description = description.trim();
    }

    // Manejar actualización de tags
    const oldTags: string[] = bookmarkData?.tags || [];
    let newTags: string[] = oldTags;

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        throw new HttpsError(
          "invalid-argument",
          "Las etiquetas deben ser un array"
        );
      }
      if (tags.length > 20) {
        throw new HttpsError(
          "invalid-argument",
          "Demasiadas etiquetas (máximo 20)"
        );
      }
      for (const tag of tags) {
        if (typeof tag !== "string") {
          throw new HttpsError(
            "invalid-argument",
            "Cada etiqueta debe ser una cadena de texto"
          );
        }
        if (tag.length > 50) {
          throw new HttpsError(
            "invalid-argument",
            "Una etiqueta es demasiado larga (máximo 50 caracteres)"
          );
        }
      }
      updateData.tags = tags;
      newTags = tags;
    }

    if (folderId !== undefined) {
      if (folderId !== null && typeof folderId !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "El ID de carpeta debe ser una cadena de texto o null"
        );
      }
      if (folderId !== null && folderId.length === 0) {
        throw new HttpsError(
          "invalid-argument",
          "El ID de carpeta no puede estar vacío"
        );
      }
      updateData.folderId = folderId;
    }

    // Manejar actualización de screenshot
    if (screenshotUrl !== undefined) {
      if (screenshotUrl !== null && typeof screenshotUrl !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "La URL del screenshot debe ser una cadena de texto o null"
        );
      }
      if (screenshotUrl !== null) {
        // Validar que sea una URL válida de Firebase Storage
        if (!screenshotUrl.includes("firebasestorage.googleapis.com")) {
          throw new HttpsError(
            "invalid-argument",
            "La URL del screenshot debe ser de Firebase Storage"
          );
        }
        updateData.screenshotUrl = screenshotUrl;
        updateData.screenshotStatus = "completed";
      } else {
        updateData.screenshotUrl = null;
        updateData.screenshotStatus = "pending";
      }
    }

    // Actualizar el documento
    await bookmarkRef.update(updateData);

    logger.info("updateBookmark - Documento actualizado", {
      bookmarkId,
      updateData,
    });

    // Actualizar conteo de tags si cambiaron
    if (tags !== undefined) {
      // Encontrar tags añadidos y removidos
      const tagsAdded = newTags.filter((tag) => !oldTags.includes(tag));
      const tagsRemoved = oldTags.filter((tag) => !newTags.includes(tag));

      if (tagsAdded.length > 0 || tagsRemoved.length > 0) {
        await updateTagCounts(tagsAdded, tagsRemoved);
      }
    }

    return {
      success: true,
      message: "Bookmark actualizado correctamente",
    };
  }
);
