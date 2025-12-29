/**
 * Tests para updateBookmark Cloud Function
 */

import * as admin from "firebase-admin";
import { expect } from "chai";
import { updateBookmark } from "./update";
import { test } from "../test-helpers";

describe("updateBookmark", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-update-123";
  const otherUserId = "other-user-456";
  let testBookmarkId: string;

  before(async () => {
    // Firebase Admin ya está inicializado en test-helpers
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
      screenshotRetries: 0,
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
        data: {
          bookmarkId: testBookmarkId,
          title: "Updated Title",
        },

        auth: {
          uid: testUserId,
        },
      } as any
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
        data: {
          bookmarkId: testBookmarkId,
          description: "Updated description",
        },
        auth: {
          uid: testUserId,
        },
      } as any
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
        data: {
          bookmarkId: testBookmarkId,
          tags: ["newtag1", "newtag2", "newtag3"],
        },
        auth: {
          uid: testUserId,
        },
      } as any
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
        data: {
          bookmarkId: testBookmarkId,
          title: "Multi Update Title",
          description: "Multi Update Description",
          tags: ["multi1", "multi2"],
        },
        auth: {
          uid: testUserId,
        },
      } as any
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
          data: {
            bookmarkId: testBookmarkId,
            title: "Should Fail",
          }
        } as any
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
          data: {
            bookmarkId: testBookmarkId,
            title: "Should Fail",
          },

          auth: {
            uid: otherUserId,
          },
        } as any
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
          data: {
            bookmarkId: "non-existent-id",
            title: "Should Fail",
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

  it("debe rechazar título vacío", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          data: {
            bookmarkId: testBookmarkId,
            title: "   ",
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

  it("debe rechazar demasiados tags", async () => {
    const wrapped = test.wrap(updateBookmark);
    const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);

    try {
      await wrapped(
        {
          data: {
            bookmarkId: testBookmarkId,
            tags: tooManyTags,
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

  it("debe actualizar la URL del screenshot", async () => {
    const wrapped = test.wrap(updateBookmark);
    const newScreenshotUrl = "https://firebasestorage.googleapis.com/v0/b/test-bucket/o/screenshots%2Ftest-user%2Fimage.jpg?alt=media";

    const result = await wrapped(
      {
        data: {
          bookmarkId: testBookmarkId,
          screenshotUrl: newScreenshotUrl,
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.data()?.screenshotUrl).to.equal(newScreenshotUrl);
    expect(doc.data()?.screenshotStatus).to.equal("completed");
  });

  it("debe rechazar URL de screenshot que no es de Firebase Storage", async () => {
    const wrapped = test.wrap(updateBookmark);

    try {
      await wrapped(
        {
          data: {
            bookmarkId: testBookmarkId,
            screenshotUrl: "https://example.com/image.jpg",
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

  it("debe permitir establecer screenshotUrl en null", async () => {
    const wrapped = test.wrap(updateBookmark);

    const result = await wrapped(
      {
        data: {
          bookmarkId: testBookmarkId,
          screenshotUrl: null,
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.success).to.be.true;

    // Verificar actualización
    const doc = await db.collection("bookmarks").doc(testBookmarkId).get();
    expect(doc.data()?.screenshotUrl).to.be.null;
    expect(doc.data()?.screenshotStatus).to.equal("pending");
  });
});
