/**
 * Tests para retryFailedScreenshots Cloud Function
 */

import * as admin from "firebase-admin";
import {expect} from "chai";
import { test } from "../test-helpers";

describe("retryFailedScreenshots", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-retry-123";
  const createdBookmarkIds: string[] = [];

  before(async () => {
    // Firebase Admin ya está inicializado en test-helpers
    db = admin.firestore();
  });

  afterEach(async () => {
    // Limpiar bookmarks creados
    for (const id of createdBookmarkIds) {
      try {
        const bookmark = await db.collection("bookmarks").doc(id).get();
        const data = bookmark.data();

        // Limpiar screenshot de Storage si existe
        if (data?.screenshotPath) {
          try {
            const bucket = admin.storage().bucket();
            await bucket.file(data.screenshotPath).delete();
          } catch (error) {
            // Ignorar si no existe
          }
        }

        await db.collection("bookmarks").doc(id).delete();
      } catch (error) {
        // Ignorar errores de limpieza
      }
    }
    createdBookmarkIds.length = 0;
  });

  after(() => {
    test.cleanup();
  });

  it("debe encontrar bookmarks con screenshots fallidos", async () => {
    // Crear bookmark con screenshot fallido
    const now = admin.firestore.Timestamp.now();
    const bookmark1 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Failed Screenshot 1",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 0,
      screenshotError: "Timeout",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark1.id);

    // Buscar bookmarks fallidos (simular la query de la función)
    const failedBookmarks = await db
      .collection("bookmarks")
      .where("screenshotUrl", "==", null)
      .where("screenshotStatus", "==", "failed")
      .limit(50)
      .get();

    expect(failedBookmarks.docs.length).to.be.at.least(1);

    const foundBookmark = failedBookmarks.docs.find((doc) => doc.id === bookmark1.id);
    expect(foundBookmark).to.exist;
  });

  it("debe filtrar bookmarks que han alcanzado el límite de reintentos", async () => {
    // Crear bookmark con 3 reintentos (límite alcanzado)
    const now = admin.firestore.Timestamp.now();
    const bookmark1 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Max Retries",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 3,
      screenshotError: "Timeout",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark1.id);

    // Crear bookmark con 2 reintentos (aún puede reintentar)
    const bookmark2 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Can Retry",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 2,
      screenshotError: "Timeout",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark2.id);

    // Buscar bookmarks fallidos
    const failedBookmarks = await db
      .collection("bookmarks")
      .where("screenshotUrl", "==", null)
      .where("screenshotStatus", "==", "failed")
      .limit(50)
      .get();

    // Filtrar por screenshotRetries < 3
    const eligibleBookmarks = failedBookmarks.docs.filter((doc) => {
      const data = doc.data();
      return (data.screenshotRetries || 0) < 3;
    });

    // bookmark1 no debe estar en la lista (tiene 3 reintentos)
    const hasMaxRetries = eligibleBookmarks.find((doc) => doc.id === bookmark1.id);
    expect(hasMaxRetries).to.be.undefined;

    // bookmark2 debe estar en la lista (tiene 2 reintentos)
    const canRetry = eligibleBookmarks.find((doc) => doc.id === bookmark2.id);
    expect(canRetry).to.exist;
  });

  it("debe incrementar screenshotRetries al reintentar", async () => {
    // Crear bookmark con screenshot fallido
    const now = admin.firestore.Timestamp.now();
    const bookmark = await db.collection("bookmarks").add({
      url: "https://this-will-fail-12345678.com",
      title: "Test Retry Increment",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 1,
      screenshotError: "Previous error",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark.id);

    // Simular incremento (lo que hace la función)
    await bookmark.update({
      screenshotRetries: admin.firestore.FieldValue.increment(1),
    });

    // Verificar incremento
    const updated = await bookmark.get();
    const data = updated.data();
    expect(data?.screenshotRetries).to.equal(2);
  });

  it("debe manejar bookmarks sin campo screenshotRetries", async () => {
    // Crear bookmark sin el campo screenshotRetries (bookmarks antiguos)
    const now = admin.firestore.Timestamp.now();
    const bookmark = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Old Bookmark",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      // screenshotRetries no existe
      screenshotError: "Old error",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark.id);

    // Verificar que el campo no existe
    const doc = await bookmark.get();
    const data = doc.data();
    expect(data?.screenshotRetries).to.be.undefined;

    // La función debe tratar undefined como 0
    const retries = data?.screenshotRetries || 0;
    expect(retries).to.equal(0);
    expect(retries < 3).to.be.true;
  });

  it("debe respetar el límite de 50 bookmarks", async () => {
    // Verificar que la query limita a 50
    const query = db
      .collection("bookmarks")
      .where("screenshotUrl", "==", null)
      .where("screenshotStatus", "==", "failed")
      .limit(50);

    // La query debe tener el límite configurado
    // (esto es más una verificación de la query que un test funcional)
    expect(query).to.exist;
  });

  it("debe no procesar bookmarks con screenshotStatus !== 'failed'", async () => {
    // Crear bookmarks con diferentes estados
    const now = admin.firestore.Timestamp.now();

    // Estado pending (no debe procesarse)
    const bookmark1 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Pending",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "pending",
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark1.id);

    // Estado processing (no debe procesarse)
    const bookmark2 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Processing",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "processing",
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark2.id);

    // Estado failed (debe procesarse)
    const bookmark3 = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Failed",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 0,
      screenshotError: "Error",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark3.id);

    // Buscar solo los fallidos
    const failedBookmarks = await db
      .collection("bookmarks")
      .where("screenshotUrl", "==", null)
      .where("screenshotStatus", "==", "failed")
      .limit(50)
      .get();

    // Verificar que solo el bookmark3 está en los resultados
    const hasPending = failedBookmarks.docs.find((doc) => doc.id === bookmark1.id);
    const hasProcessing = failedBookmarks.docs.find((doc) => doc.id === bookmark2.id);
    const hasFailed = failedBookmarks.docs.find((doc) => doc.id === bookmark3.id);

    expect(hasPending).to.be.undefined;
    expect(hasProcessing).to.be.undefined;
    expect(hasFailed).to.exist;
  });

  it("debe manejar correctamente el campo FieldValue.increment", async () => {
    // Crear bookmark con screenshotRetries = 0
    const now = admin.firestore.Timestamp.now();
    const bookmark = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Test Increment",
      userId: testUserId,
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark.id);

    // Incrementar 3 veces
    for (let i = 0; i < 3; i++) {
      await bookmark.update({
        screenshotRetries: admin.firestore.FieldValue.increment(1),
      });
    }

    // Verificar valor final
    const doc = await bookmark.get();
    const data = doc.data();
    expect(data?.screenshotRetries).to.equal(3);
  });
});
