/**
 * Tests para getBookmarks Cloud Function
 */

import * as admin from "firebase-admin";
import {expect} from "chai";
import * as functionsTest from "firebase-functions-test";
import {getBookmarks} from "./get";

// Inicializar firebase-functions-test
const test = functionsTest();

describe("getBookmarks", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-get-123";
  const createdBookmarkIds: string[] = [];

  before(async () => {
    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();

    // Crear bookmarks de prueba
    const now = admin.firestore.Timestamp.now();

    const bookmark1 = await db.collection("bookmarks").add({
      url: "https://example1.com",
      title: "Example 1",
      description: "First example",
      tags: ["tag1", "tag2"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark1.id);

    const bookmark2 = await db.collection("bookmarks").add({
      url: "https://example2.com",
      title: "Example 2",
      description: "Second example",
      tags: ["tag2", "tag3"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      createdAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 1000)
      ),
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark2.id);

    const bookmark3 = await db.collection("bookmarks").add({
      url: "https://example3.com",
      title: "Example 3",
      description: "Third example",
      tags: ["tag1"],
      userId: testUserId,
      folderId: "folder1",
      screenshotUrl: null,
      screenshotStatus: "pending",
      createdAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 2000)
      ),
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark3.id);
  });

  after(async () => {
    // Limpiar bookmarks creados
    for (const id of createdBookmarkIds) {
      await db.collection("bookmarks").doc(id).delete();
    }
    test.cleanup();
  });

  it("debe obtener todos los bookmarks del usuario", async () => {
    const wrapped = test.wrap(getBookmarks);
    const result = await wrapped(
      {limit: 20},
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.data).to.be.an("array");
    expect(result.data.length).to.be.at.least(3);
    expect(result.hasMore).to.be.a("boolean");
  });

  it("debe filtrar por tags", async () => {
    const wrapped = test.wrap(getBookmarks);
    const result = await wrapped(
      {
        limit: 20,
        tags: ["tag1"],
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.data).to.be.an("array");
    expect(result.data.length).to.be.at.least(2);
    result.data.forEach((bookmark) => {
      expect(bookmark.tags).to.include("tag1");
    });
  });

  it("debe filtrar por búsqueda de texto", async () => {
    const wrapped = test.wrap(getBookmarks);
    const result = await wrapped(
      {
        limit: 20,
        search: "Second",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.data).to.be.an("array");
    expect(result.data.length).to.be.at.least(1);
    expect(result.data[0].description).to.include("Second");
  });

  it("debe filtrar por carpeta", async () => {
    const wrapped = test.wrap(getBookmarks);
    const result = await wrapped(
      {
        limit: 20,
        folderId: "folder1",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.data).to.be.an("array");
    expect(result.data.length).to.be.at.least(1);
    result.data.forEach((bookmark) => {
      expect(bookmark.folderId).to.equal("folder1");
    });
  });

  it("debe implementar paginación", async () => {
    const wrapped = test.wrap(getBookmarks);

    // Primera página
    const firstPage = await wrapped(
      {limit: 1},
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(firstPage.data).to.have.lengthOf(1);
    expect(firstPage.hasMore).to.be.true;
    expect(firstPage.lastDocId).to.be.a("string");

    // Segunda página
    const secondPage = await wrapped(
      {
        limit: 1,
        lastDocId: firstPage.lastDocId,
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(secondPage.data).to.have.lengthOf(1);
    expect(secondPage.data[0].id).to.not.equal(firstPage.data[0].id);
  });

  it("debe rechazar sin autenticación", async () => {
    const wrapped = test.wrap(getBookmarks);

    try {
      await wrapped({limit: 20}, {});
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });
});
