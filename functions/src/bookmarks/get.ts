/**
 * Cloud Function para obtener bookmarks con filtros y paginación
 */

import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/v2/https";
import {verifyAuth} from "../utils/auth";

/**
 * Interface para los parámetros de getBookmarks
 */
export interface GetBookmarksParams {
  limit?: number;
  lastDocId?: string;
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
}

/**
 * Interface para un bookmark retornado
 */
export interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  folderId: string | null;
  screenshotUrl: string | null;
  screenshotStatus: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para la respuesta de getBookmarks
 */
export interface GetBookmarksResponse {
  data: BookmarkItem[];
  lastDocId: string | null;
  hasMore: boolean;
}

/**
 * Cloud Function para obtener bookmarks con filtros y paginación
 *
 * Implementa paginación cursor-based, filtros por tags, fechas y carpetas.
 * La búsqueda de texto se realiza en el cliente debido a limitaciones de Firestore.
 *
 * @param request - Request con los parámetros de búsqueda
 * @returns Lista de bookmarks, cursor de paginación y flag hasMore
 *
 * @throws HttpsError si el usuario no está autenticado
 *
 * @example
 * ```typescript
 * const result = await getBookmarks({
 *   limit: 20,
 *   tags: ["web", "tools"],
 *   dateFrom: "2024-01-01",
 *   dateTo: "2024-12-31"
 * });
 * ```
 */
export const getBookmarks = onCall<GetBookmarksParams, Promise<GetBookmarksResponse>>(
  {
    timeoutSeconds: 60,
    memory: "256MB",
  },
  async (request) => {
    // Verificar autenticación
    const userId = verifyAuth(request);

    const {
      limit = 20,
      lastDocId,
      tags,
      search,
      dateFrom,
      dateTo,
      folderId,
    } = request.data;

    const db = admin.firestore();

    // Construir query base
    let query: admin.firestore.Query = db
      .collection("bookmarks")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc");

    // Filtro por carpeta
    if (folderId !== undefined) {
      query = query.where("folderId", "==", folderId || null);
    }

    // Filtro por tags (array-contains-any soporta máximo 10 valores)
    if (tags && tags.length > 0) {
      const tagsToFilter = tags.slice(0, 10);
      query = query.where("tags", "array-contains-any", tagsToFilter);
    }

    // Filtro por fecha desde
    if (dateFrom) {
      const fromDate = admin.firestore.Timestamp.fromDate(new Date(dateFrom));
      query = query.where("createdAt", ">=", fromDate);
    }

    // Filtro por fecha hasta
    if (dateTo) {
      const toDate = admin.firestore.Timestamp.fromDate(new Date(dateTo));
      query = query.where("createdAt", "<=", toDate);
    }

    // Paginación cursor-based
    if (lastDocId) {
      const lastDoc = await db.collection("bookmarks").doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    // Obtener limit + 1 para saber si hay más resultados
    query = query.limit(limit + 1);

    const snapshot = await query.get();

    // Verificar si hay más resultados
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    // Mapear documentos a BookmarkItem
    let bookmarks: BookmarkItem[] = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url,
        title: data.title,
        description: data.description || "",
        tags: data.tags || [],
        folderId: data.folderId || null,
        screenshotUrl: data.screenshotUrl || null,
        screenshotStatus: data.screenshotStatus || "pending",
        createdAt: data.createdAt?.toDate().toISOString() || "",
        updatedAt: data.updatedAt?.toDate().toISOString() || "",
      };
    });

    // Filtrar por búsqueda de texto (en cliente)
    if (search && search.trim().length > 0) {
      const searchLower = search.toLowerCase();
      bookmarks = bookmarks.filter((bookmark) => {
        return (
          bookmark.title.toLowerCase().includes(searchLower) ||
          bookmark.description.toLowerCase().includes(searchLower) ||
          bookmark.url.toLowerCase().includes(searchLower) ||
          bookmark.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Obtener el último documento para cursor
    const lastDocIdResult = bookmarks.length > 0 ?
      bookmarks[bookmarks.length - 1].id :
      null;

    return {
      data: bookmarks,
      lastDocId: lastDocIdResult,
      hasMore,
    };
  }
);
