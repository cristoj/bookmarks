/**
 * Cloud Function para obtener el count de bookmarks con filtros
 */

import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/v2/https";
import {verifyAuth} from "../utils/auth";
import {ALLOWED_ORIGINS} from "../utils/cors";

/**
 * Interface para los parámetros de getBookmarksCount
 */
export interface GetBookmarksCountParams {
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
}

/**
 * Interface para la respuesta de getBookmarksCount
 */
export interface GetBookmarksCountResponse {
  count: number;
}

/**
 * Cloud Function para obtener el count de bookmarks con filtros
 *
 * Usa getCountFromServer de Firestore para hacer un conteo eficiente
 * que solo consume 1 lectura agregada en lugar de N lecturas.
 *
 * NOTA: El filtro de búsqueda (search) requiere leer todos los documentos
 * para filtrar en el servidor, por lo que en ese caso el count será
 * menos eficiente. Para mantener la consistencia con getBookmarks,
 * usamos la misma lógica de filtrado.
 *
 * @param request - Request con los mismos parámetros de búsqueda que getBookmarks
 * @returns Objeto con el count de bookmarks que coinciden con los filtros
 *
 * @throws HttpsError si el usuario no está autenticado
 *
 * @example
 * ```typescript
 * const result = await getBookmarksCount({
 *   tags: ["web", "tools"],
 *   dateFrom: "2024-01-01",
 *   dateTo: "2024-12-31"
 * });
 * console.log(result.count); // 42
 * ```
 */
export const getBookmarksCount = onCall<GetBookmarksCountParams, Promise<GetBookmarksCountResponse>>(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    const {
      tags,
      search,
      dateFrom,
      dateTo,
      folderId,
    } = request.data;

    const db = admin.firestore();

    // Si hay búsqueda de texto, necesitamos leer todos los documentos
    // porque Firestore no soporta búsqueda full-text
    if (search && search.trim().length > 0) {
      // Construir query para obtener todos los documentos (sin paginación)
      let query: admin.firestore.Query = db
        .collection("bookmarks")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc");

      // Aplicar filtros adicionales
      if (folderId !== undefined) {
        query = query.where("folderId", "==", folderId || null);
      }

      if (tags && tags.length > 0) {
        const tagsToFilter = tags.slice(0, 10);
        query = query.where("tags", "array-contains-any", tagsToFilter);
      }

      if (dateFrom) {
        const fromDate = admin.firestore.Timestamp.fromDate(new Date(dateFrom));
        query = query.where("createdAt", ">=", fromDate);
      }

      if (dateTo) {
        const toDate = admin.firestore.Timestamp.fromDate(new Date(dateTo));
        query = query.where("createdAt", "<=", toDate);
      }

      // Obtener documentos y filtrar por texto
      const snapshot = await query.get();
      const searchLower = search.toLowerCase();

      const filteredCount = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return (
          (data.title || "").toLowerCase().includes(searchLower) ||
          (data.description || "").toLowerCase().includes(searchLower) ||
          (data.url || "").toLowerCase().includes(searchLower) ||
          (data.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }).length;

      return {count: filteredCount};
    }

    // Sin búsqueda de texto, podemos usar getCountFromServer (eficiente)
    let query: admin.firestore.Query = db
      .collection("bookmarks")
      .where("userId", "==", userId);

    // Aplicar filtros
    if (folderId !== undefined) {
      query = query.where("folderId", "==", folderId || null);
    }

    if (tags && tags.length > 0) {
      const tagsToFilter = tags.slice(0, 10);
      query = query.where("tags", "array-contains-any", tagsToFilter);
    }

    if (dateFrom) {
      const fromDate = admin.firestore.Timestamp.fromDate(new Date(dateFrom));
      query = query.where("createdAt", ">=", fromDate);
    }

    if (dateTo) {
      const toDate = admin.firestore.Timestamp.fromDate(new Date(dateTo));
      query = query.where("createdAt", "<=", toDate);
    }

    // Usar count aggregation query (eficiente - solo 1 lectura)
    const snapshot = await query.count().get();

    return {
      count: snapshot.data().count,
    };
  }
);
