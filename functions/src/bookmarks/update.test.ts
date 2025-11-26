/**
 * Tests para updateBookmark Cloud Function
 */

import * as admin from "firebase-admin";
import {expect} from "chai";
import * as functionsTest from "firebase-functions-test";
import {updateBookmark} from "./update";

// Inicializar firebase-functions-test
const test = functionsTest();

describe("updateBookmark", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-update-123";
  const otherUserId = "other-user-456";
  let testBookmarkId: string;

  before(async () => {
    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();

    // Crear bookmark de prueba
    const now = admin.firestore.Timestamp.now();
    const bookmarkRef = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Original Title",
      description: "Original description",
      tags: ["tag1", "tag2"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    testBookmarkId = bookmarkRef.id;
  });

  after(async () => {
    // Limpiar
    if (testBookmarkId) {
      await db.collection("bookmarks").doc(testBookmarkId).delete();
    }
    test.cleanup();
  });

  it("debe actualizar el título del bookmark", async () => {
    const wrapped = test.wrap(updateBookmark);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        title: "Updated Title",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.data()?.title).to.equal("Updated Title");
  });

  it("debe actualizar la descripción del bookmark", async () => {
    const wrapped = test.wrap(updateBookmark);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        description: "Updated description",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.data()?.description).to.equal("Updated description");
  });

  it("debe actualizar los tags del bookmark", async () => {
    const wrapped = test.wrap(updateBookmark);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        tags: ["newtag1", "newtag2", "newtag3"],
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.data()?.tags).to.deep.equal(["newtag1", "newtag2", "newtag3"]);
  });

  it("debe actualizar múltiples campos a la vez", async () => {
    const wrapped = test.wrap(updateBookmark);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        title: "Multi Update Title",
        description: "Multi Update Description",
        tags: ["multi1", "multi2"],
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = doc.data();
    expect(data?.title).to.equal("Multi Update Title");
    expect(data?.description).to.equal("Multi Update Description");
    expect(data?.tags).to.deep.equal(["multi1", "multi2"]);
  });

  it("debe rechazar actualización sin autenticación", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          title: "Should Fail",
        },
        {}
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });

  it("debe rechazar actualización de bookmark de otro usuario", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          title: "Should Fail",
        },
        {
          auth: {
            uid: otherUserId,
          },
        }
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("permission-denied");
    }
  });

  it("debe rechazar actualización de bookmark inexistente", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          bookmarkId: "non-existent-id",
          title: "Should Fail",
        },
        {
          auth: {
            uid: testUserId,
          },
        }
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("not-found");
    }
  });

  it("debe rechazar título vacío", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          title: "   ",
        },
        {
          auth: {
            uid: testUserId,
          },
        }
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
    }
  });

  it("debe rechazar demasiados tags", async () => {
    const wrapped = test.wrap(updateBookmark);
    const tooManyTags = Array.from({length: 21}, (_, i) => `tag${i}`);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          tags: tooManyTags,
        },
        {
          auth: {
            uid: testUserId,
          },
        }
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
    }
  });
});
