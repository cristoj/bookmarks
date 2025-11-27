/**
 * Cloud Function para obtener tags
 */

import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/v2/https";
import {verifyAuth} from "../utils/auth";

/**
 * Interface para un tag
 */
export interface Tag {
  name: string;
  count: number;
  updatedAt: string;
}

/**
 * Interface para la respuesta de getTags
 */
export interface GetTagsResponse {
  tags: Tag[];
  total: number;
}

/**
 * Cloud Function para obtener todos los tags
 *
 * Retorna todos los tags ordenados por count descendente
 * con un límite de 100 tags
 *
 * @param request - Request (sin parámetros)
 * @returns Lista de tags ordenados por popularidad
 *
 * @throws HttpsError si el usuario no está autenticado
 *
 * @example
 * ```typescript
 * const result = await getTags();
 * // result = {
 * //   tags: [
 * //     { name: "javascript", count: 42, updatedAt: "..." },
 * //     { name: "react", count: 38, updatedAt: "..." }
 * //   ],
 * //   total: 2
 * // }
 * ```
 */
export const getTags = onCall<void, Promise<GetTagsResponse>>(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Verificar autenticación
    verifyAuth(request);

    const db = admin.firestore();

    // Obtener tags ordenados por count descendente
    // Limitado a 100 tags
    const snapshot = await db
      .collection("tags")
      .orderBy("count", "desc")
      .limit(100)
      .get();

    // Mapear documentos a Tag interface
    const tags: Tag[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          name: data.name || doc.id,
          count: data.count || 0,
          updatedAt: data.updatedAt?.toDate().toISOString() || "",
        };
      })
      // Filtrar tags con count <= 0 (pueden quedar después de eliminaciones)
      .filter((tag) => tag.count > 0);

    return {
      tags,
      total: tags.length,
    };
  }
);
