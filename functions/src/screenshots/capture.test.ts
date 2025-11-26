/**
 * Tests para captureScreenshot Cloud Function
 *
 * NOTA: Algunos tests requieren conexión a internet real y pueden tardar
 * debido al lanzamiento de Puppeteer. En CI/CD, considera usar mocks.
 */

import * as admin from "firebase-admin";
import {expect} from "chai";
import * as functionsTest from "firebase-functions-test";
import {captureScreenshot} from "./capture";

// Inicializar firebase-functions-test
const test = functionsTest();

describe("captureScreenshot", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-screenshot-123";
  const otherUserId = "other-user-456";
  let testBookmarkId: string;

  before(async () => {
    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  });

  beforeEach(async () => {
    // Crear bookmark de prueba para cada test
    const now = admin.firestore.Timestamp.now();
    const bookmarkRef = await db.collection("bookmarks").add({
      url: "https://example.com",
      title: "Test Bookmark",
      description: "For screenshot testing",
      tags: [],
      userId: testUserId,
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    testBookmarkId = bookmarkRef.id;
  });

  afterEach(async () => {
    // Limpiar bookmark
    if (testBookmarkId) {
      const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
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

      await db.collection("bookmarks").doc(testBookmarkId).delete();
    }
  });

  after(() => {
    test.cleanup();
  });

  it("debe capturar screenshot correctamente para URL válida", async function() {
    // Este test puede tardar debido a Puppeteer
    this.timeout(60000);

    const wrapped = test.wrap(captureScreenshot);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        url: "https://example.com",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;
    expect(result.screenshotUrl).to.be.a("string");
    expect(result.screenshotUrl).to.include("storage.googleapis.com");

    // Verificar actualización en Firestore
    const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = bookmark.data();

    expect(data?.screenshotUrl).to.equal(result.screenshotUrl);
    expect(data?.screenshotPath).to.be.a("string");
    expect(data?.screenshotPath).to.include(`screenshots/${testUserId}/`);
    expect(data?.screenshotStatus).to.equal("completed");
    expect(data?.screenshotError).to.be.null;

    // Verificar que el archivo existe en Storage
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.file(data?.screenshotPath).exists();
    expect(exists).to.be.true;
  });

  it("debe actualizar estado a processing durante captura", async function() {
    this.timeout(60000);

    const wrapped = test.wrap(captureScreenshot);

    // Ejecutar captura
    const resultPromise = wrapped(
      {
        bookmarkId: testBookmarkId,
        url: "https://example.com",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    // Esperar un poco y verificar estado
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = bookmark.data();

    // Durante la captura, el estado debe ser processing o completed
    expect(["processing", "completed"]).to.include(data?.screenshotStatus);

    // Esperar a que termine
    await resultPromise;
  });

  it("debe manejar error para URL inválida sin lanzar excepción", async function() {
    this.timeout(60000);

    const wrapped = test.wrap(captureScreenshot);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        url: "https://this-domain-should-not-exist-12345678.com",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.false;
    expect(result.error).to.be.a("string");

    // Verificar actualización en Firestore
    const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = bookmark.data();

    expect(data?.screenshotUrl).to.be.null;
    expect(data?.screenshotStatus).to.equal("failed");
    expect(data?.screenshotError).to.be.a("string");
  });

  it("debe rechazar captura sin autenticación", async () => {
    const wrapped = test.wrap(captureScreenshot);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          url: "https://example.com",
        },
        {}
      );
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });

  it("debe rechazar captura de bookmark de otro usuario", async () => {
    const wrapped = test.wrap(captureScreenshot);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          url: "https://example.com",
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

  it("debe rechazar bookmarkId inválido", async () => {
    const wrapped = test.wrap(captureScreenshot);

    try {
      await wrapped(
        {
          bookmarkId: "",
          url: "https://example.com",
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

  it("debe rechazar URL malformada", async () => {
    const wrapped = test.wrap(captureScreenshot);

    try {
      await wrapped(
        {
          bookmarkId: testBookmarkId,
          url: "not-a-valid-url",
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

  it("debe rechazar bookmark inexistente", async () => {
    const wrapped = test.wrap(captureScreenshot);

    try {
      await wrapped(
        {
          bookmarkId: "non-existent-id",
          url: "https://example.com",
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

  it("debe generar path de Storage correcto", async function() {
    this.timeout(60000);

    const wrapped = test.wrap(captureScreenshot);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        url: "https://example.com",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = bookmark.data();

    // Verificar formato del path
    expect(data?.screenshotPath).to.match(/^screenshots\/[\w-]+\/[\w-]+\.png$/);
    expect(data?.screenshotPath).to.include(`screenshots/${testUserId}/`);
    expect(data?.screenshotPath).to.include(".png");
  });

  it("debe incluir metadata en archivo de Storage", async function() {
    this.timeout(60000);

    const wrapped = test.wrap(captureScreenshot);
    const result = await wrapped(
      {
        bookmarkId: testBookmarkId,
        url: "https://example.com",
      },
      {
        auth: {
          uid: testUserId,
        },
      }
    );

    expect(result.success).to.be.true;

    const bookmark = await db.collection("bookmarks").doc(testBookmarkId).get();
    const data = bookmark.data();

    // Obtener metadata del archivo
    const bucket = admin.storage().bucket();
    const [metadata] = await bucket.file(data?.screenshotPath).getMetadata();

    expect(metadata.contentType).to.equal("image/png");
    expect(metadata.metadata.bookmarkId).to.equal(testBookmarkId);
    expect(metadata.metadata.userId).to.equal(testUserId);
    expect(metadata.metadata.capturedAt).to.be.a("string");
  });
});
