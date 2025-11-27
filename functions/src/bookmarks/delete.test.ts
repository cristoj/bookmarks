/**
 * Tests para deleteBookmark Cloud Function
 */

import * as admin from "firebase-admin";
import { expect } from "chai";
import { deleteBookmark } from "./delete";
import { test } from "../test-helpers";

describe("deleteBookmark", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-delete-123";
  const otherUserId = "other-user-456";
  let testBookmarkId: string;

  beforeEach(async () => {
    // Firebase Admin ya está inicializado en test-helpers
    db = admin.firestore();

    // Crear bookmark de prueba para cada test
    const now = admin.firestore.Timestamp.now();
    const bookmarkRef = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Test Bookmark",
      description: "To be deleted",
      tags: ["tag1", "tag2"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    });
    testBookmarkId = bookmarkRef.id;
  });

  after(() => {
    test.cleanup();
  });

  it("debe eliminar un bookmark correctamente", async () => {
    const wrapped = test.wrap(deleteBookmark);
    const result = await wrapped({
      data:
      {
        bookmarkId: testBookmarkId,
      },

      auth: {
        uid: testUserId,
      },
    } as any
    );

    expect(result.success).to.be.true;
    expect(result.message).to.include("eliminado");

    // Verificar que el bookmark fue eliminado
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.exists).to.be.false;
  });

  it("debe rechazar eliminación sin autenticación", async () => {
    const wrapped = test.wrap(deleteBookmark);

    try {
      await wrapped({
        data: {
          bookmarkId: testBookmarkId,
        }
      } as any
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }

    // Verificar que el bookmark no fue eliminado
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.exists).to.be.true;
  });

  it("debe rechazar eliminación de bookmark de otro usuario", async () => {
    const wrapped = test.wrap(deleteBookmark);

    try {
      await wrapped({
        data: {
          bookmarkId: testBookmarkId,
        },
        auth: {
          uid: otherUserId,
        }
      } as any
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("permission-denied");
    }

    // Verificar que el bookmark no fue eliminado
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.exists).to.be.true;
  });

  it("debe rechazar eliminación de bookmark inexistente", async () => {
    const wrapped = test.wrap(deleteBookmark);

    try {
      await wrapped(
        {
          data: {
            bookmarkId: "non-existent-id",
          },

          auth: {
            uid: testUserId,
          },
        } as any
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("not-found");
    }
  });

  it("debe rechazar bookmarkId inválido", async () => {
    const wrapped = test.wrap(deleteBookmark);

    try {
      await wrapped({
        data:
        {
          bookmarkId: "",
        },
        auth: {
          uid: testUserId,
        },
      } as any
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
    }
  });

  it("debe manejar eliminación de bookmark con screenshot", async () => {
    // Actualizar el bookmark para tener un screenshotUrl
    await db.collection("bookmarks").doc(testBookmarkId).update({
      screenshotUrl: `https://storage.googleapis.com/bucket/screenshots/${testUserId}/${testBookmarkId}.png`,
    });

    const wrapped = test.wrap(deleteBookmark);
    const result = await wrapped(
      {
        data: {
          bookmarkId: testBookmarkId,
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.success).to.be.true;

    // Verificar que el bookmark fue eliminado
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.exists).to.be.false;

    // Nota: En un entorno de test real, también verificaríamos que
    // el archivo fue eliminado de Storage, pero eso requiere
    // configuración adicional del emulador de Storage
  });
});
