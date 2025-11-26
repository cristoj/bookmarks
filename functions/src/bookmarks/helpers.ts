/**
 * Helpers para gestión de bookmarks
 */

import * as admin from "firebase-admin";

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
    if (!tag) continue;
    const tagRef = db.collection("tags").doc(tag.toLowerCase());
    batch.set(
      tagRef,
      {
        name: tag,
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
  }

  // Decrementar contadores para tags removidos
  for (const tag of tagsToRemove) {
    if (!tag) continue;
    const tagRef = db.collection("tags").doc(tag.toLowerCase());
    batch.update(tagRef, {
      count: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}
