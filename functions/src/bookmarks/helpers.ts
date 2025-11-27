/**
 * Helpers para gestión de bookmarks
 */

import * as admin from "firebase-admin";
import {Timestamp, FieldValue} from "firebase-admin/firestore";

/**
 * Normaliza un tag para usarlo como document ID
 * - Convierte a minúsculas
 * - Reemplaza espacios con guiones
 * - Elimina caracteres especiales
 *
 * @param tag - Tag a normalizar
 * @return Tag normalizado para usar como document ID
 */
function normalizeTagForId(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios con guiones
    .replace(/[^a-z0-9-]/g, ""); // Eliminar caracteres especiales
}

/**
 * Actualiza los conteos de tags en Firestore
 * Incrementa o decrementa el contador para cada tag
 *
 * @param tagsToAdd - Tags a incrementar
 * @param tagsToRemove - Tags a decrementar
 */
export async function updateTagCounts(
  tagsToAdd: string[] = [],
  tagsToRemove: string[] = []
): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();

  // Incrementar contadores para tags nuevos
  for (const tag of tagsToAdd) {
    if (!tag || !tag.trim()) continue;
    const tagId = normalizeTagForId(tag);
    const tagRef = db.collection("tags").doc(tagId);
    batch.set(
      tagRef,
      {
        name: tag.trim(),
        count: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  // Decrementar contadores para tags removidos
  for (const tag of tagsToRemove) {
    if (!tag || !tag.trim()) continue;
    const tagId = normalizeTagForId(tag);
    const tagRef = db.collection("tags").doc(tagId);

    // Usar set con merge en lugar de update para evitar errores
    // si el documento no existe
    batch.set(
      tagRef,
      {
        count: FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  // Solo hacer commit si hay operaciones
  if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
    await batch.commit();
  }
}
