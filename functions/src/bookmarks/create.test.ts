/**
 * Tests para createBookmark Cloud Function
 */

import * as admin from "firebase-admin";
import {expect} from "chai";
import * as functionsTest from "firebase-functions-test";
import {createBookmark} from "./create";

// Inicializar firebase-functions-test
const test = functionsTest();

describe("createBookmark", () => {
  let db: admin.firestore.Firestore;

  before(() => {
    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  });

  after(() => {
    // Limpiar
    test.cleanup();
  });

  it("debe crear un bookmark con datos válidos", async () => {
    const data = {
      url: "https://example.com",
      title: "Example Site",
      description: "A great example",
      tags: ["example", "web"],
    };

    const wrapped = test.wrap(createBookmark);
    const result = await wrapped(data, {
      auth: {
        uid: "test-user-123",
      },
    });

    expect(result).to.have.property("id");
    expect(result.url).to.equal(data.url);
    expect(result.title).to.equal(data.title);
    expect(result.description).to.equal(data.description);
    expect(result.tags).to.deep.equal(data.tags);
    expect(result.userId).to.equal("test-user-123");

    // Limpiar documento creado
    if (result.id) {
      await db.collection("bookmarks").doc(result.id).delete();
    }
  });

  it("debe rechazar bookmark sin título", async () => {
    const data = {
      url: "https://example.com",
      title: "",
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped(data, {
        auth: {
          uid: "test-user-123",
        },
      });
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
    }
  });

  it("debe rechazar bookmark sin autenticación", async () => {
    const data = {
      url: "https://example.com",
      title: "Example Site",
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped(data, {});
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });

  it("debe rechazar URL inválida", async () => {
    const data = {
      url: "not-a-valid-url",
      title: "Example Site",
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped(data, {
        auth: {
          uid: "test-user-123",
        },
      });
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
    }
  });

  it("debe crear bookmark sin tags opcionales", async () => {
    const data = {
      url: "https://example.com",
      title: "Example Site",
    };

    const wrapped = test.wrap(createBookmark);
    const result = await wrapped(data, {
      auth: {
        uid: "test-user-123",
      },
    });

    expect(result).to.have.property("id");
    expect(result.tags).to.deep.equal([]);

    // Limpiar
    if (result.id) {
      await db.collection("bookmarks").doc(result.id).delete();
    }
  });
});
