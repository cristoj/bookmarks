/**
 * Tests para createBookmark Cloud Function
 */

import { expect } from "chai";
import { createBookmark } from "./create";
import { test } from "../test-helpers";

describe("createBookmark", () => {
  after(() => {
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
    const result = await wrapped({
      data,
      auth: {
        uid: "test-user-123",
      },
    } as any);

    expect(result).to.have.property("id");
    expect(result.url).to.equal(data.url);
    expect(result.title).to.equal(data.title);
    expect(result.description).to.equal(data.description);
    expect(result.tags).to.deep.equal(data.tags);
    expect(result.userId).to.equal("test-user-123");
  });

  it("debe rechazar bookmark sin título", async () => {
    const data = {
      url: "https://example.com",
      title: "",
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped({
        data,
        auth: {
          uid: "test-user-123",
        }
      } as any);
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
      await wrapped({ data } as any);
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
      await wrapped({
        data,
        auth: {
          uid: "test-user-123",
        },
      } as any);
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
    const result = await wrapped({
      data,
      auth: {
        uid: "test-user-123",
      },
    } as any);

    expect(result).to.have.property("id");
    // Tags es undefined si no se proporcionan (no se incluye en la respuesta)
    expect(result.tags).to.be.undefined;
  });

  it("debe rechazar description como null", async () => {
    const data = {
      url: "https://example.com",
      title: "Example Site",
      description: null as any,
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped({
        data,
        auth: {
          uid: "test-user-123",
        },
      } as any);
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
      expect(error.message).to.include("descripción debe ser una cadena");
    }
  });

  it("debe rechazar tags como null", async () => {
    const data = {
      url: "https://example.com",
      title: "Example Site",
      tags: null as any,
    };

    const wrapped = test.wrap(createBookmark);

    try {
      await wrapped({
        data,
        auth: {
          uid: "test-user-123",
        },
      } as any);
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("invalid-argument");
      expect(error.message).to.include("etiquetas deben ser un array");
    }
  });
});
