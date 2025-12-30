/**
 * Tests para getBookmarksCount Cloud Function
 */

import * as admin from "firebase-admin";
import { expect } from "chai";
import { getBookmarksCount } from "./count";
import { test } from "../test-helpers";

describe("getBookmarksCount", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-count-123";
  const createdBookmarkIds: string[] = [];

  before(async () => {
    // Firebase Admin ya está inicializado en test-helpers
    db = admin.firestore();

    // Crear bookmarks de prueba
    const now = admin.firestore.Timestamp.now();

    const bookmark1 = await db.collection("bookmarks").add({
      url: "https://example1.com",
      title: "JavaScript Tutorial",
      description: "Learn JavaScript",
      tags: ["javascript", "tutorial"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      screenshotRetries: 0,
      createdAt: now,
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark1.id);

    const bookmark2 = await db.collection("bookmarks").add({
      url: "https://example2.com",
      title: "React Guide",
      description: "Learn React framework",
      tags: ["react", "tutorial"],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      screenshotRetries: 0,
      createdAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 1000)
      ),
      updatedAt: now,
    });
    createdBookmarkIds.push(bookmark2.id);

    const bookmark3 = await db.collection("bookmarks").add({
      url: "https://example3.com",
      title: "TypeScript Docs",
      description: "TypeScript documentation",
      tags: ["typescript"],
      userId: testUserId,
      folderId: "folder1",
      screenshotUrl: null,
      screenshotStatus: "pending",
      screenshotRetries: 0,
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

  it("debe contar todos los bookmarks del usuario", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {},
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.be.a("number");
    expect(result.count).to.equal(3);
  });

  it("debe contar bookmarks filtrados por tags", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {
          tags: ["tutorial"],
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.equal(2); // bookmark1 y bookmark2 tienen "tutorial"
  });

  it("debe contar bookmarks filtrados por search", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {
          search: "react",
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.equal(1); // Solo bookmark2 contiene "react"
  });

  it("debe contar bookmarks filtrados por folderId", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {
          folderId: "folder1",
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.equal(1); // Solo bookmark3 está en folder1
  });

  it("debe contar bookmarks con múltiples filtros", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {
          tags: ["tutorial"],
          search: "javascript",
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.equal(1); // Solo bookmark1 tiene "tutorial" y contiene "javascript"
  });

  it("debe retornar 0 cuando no hay bookmarks que coincidan", async () => {
    const wrapped = test.wrap(getBookmarksCount);
    const result = await wrapped(
      {
        data: {
          search: "nonexistent",
        },
        auth: {
          uid: testUserId,
        },
      } as any
    );

    expect(result.count).to.equal(0);
  });

  it("debe requerir autenticación", async () => {
    const wrapped = test.wrap(getBookmarksCount);

    try {
      await wrapped({
        data: {},
        auth: undefined,
      } as any);
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });
});
