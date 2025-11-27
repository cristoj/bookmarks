/**
 * Tests para getTags Cloud Function
 */

import * as admin from "firebase-admin";
import { expect } from "chai";
import { getTags } from "./tags";
import { test } from "../test-helpers";

describe("getTags", () => {
  let db: admin.firestore.Firestore;
  const testUserId = "test-user-tags-123";
  const createdTagIds: string[] = [];

  before(async () => {
    // Firebase Admin ya está inicializado en test-helpers
    db = admin.firestore();

    // Crear tags de prueba
    const now = admin.firestore.Timestamp.now();

    // Tag 1 - más popular
    const tag1 = await db.collection("tags").add({
      name: "javascript",
      count: 50,
      updatedAt: now,
    });
    createdTagIds.push(tag1.id);

    // Tag 2 - medianamente popular
    const tag2 = await db.collection("tags").add({
      name: "react",
      count: 30,
      updatedAt: now,
    });
    createdTagIds.push(tag2.id);

    // Tag 3 - menos popular
    const tag3 = await db.collection("tags").add({
      name: "typescript",
      count: 10,
      updatedAt: now,
    });
    createdTagIds.push(tag3.id);

    // Tag 4 - sin uso (count 0, no debería aparecer)
    const tag4 = await db.collection("tags").add({
      name: "unused",
      count: 0,
      updatedAt: now,
    });
    createdTagIds.push(tag4.id);
  });

  after(async () => {
    // Limpiar tags creados
    for (const id of createdTagIds) {
      await db.collection("tags").doc(id).delete();
    }
    test.cleanup();
  });

  it("debe retornar tags ordenados por count descendente", async () => {
    const wrapped = test.wrap(getTags);
    const result = await wrapped({
      data: undefined,
      auth: {
        uid: testUserId,
      },
    } as any);

    expect(result).to.have.property("tags");
    expect(result).to.have.property("total");
    expect(result.tags).to.be.an("array");

    // Verificar que hay al menos 3 tags (los que tienen count > 0)
    expect(result.tags.length).to.be.at.least(3);
    expect(result.total).to.equal(result.tags.length);

    // Verificar que están ordenados por count descendente
    for (let i = 0; i < result.tags.length - 1; i++) {
      expect(result.tags[i].count).to.be.at.least(result.tags[i + 1].count);
    }

    // Verificar que el tag más popular es el primero
    const javascriptTag = result.tags.find((t) => t.name === "javascript");
    expect(javascriptTag).to.exist;
    expect(javascriptTag?.count).to.equal(50);
  });

  it("no debe retornar tags con count 0 o menor", async () => {
    const wrapped = test.wrap(getTags);
    const result = await wrapped({
      data: undefined,
      auth: {
        uid: testUserId,
      },
    } as any);

    // Verificar que no hay tags con count <= 0
    result.tags.forEach((tag) => {
      expect(tag.count).to.be.greaterThan(0);
    });

    // Verificar que el tag "unused" no está en los resultados
    const unusedTag = result.tags.find((t) => t.name === "unused");
    expect(unusedTag).to.be.undefined;
  });

  it("debe incluir información completa de cada tag", async () => {
    const wrapped = test.wrap(getTags);
    const result = await wrapped({
      data: undefined,
      auth: {
        uid: testUserId,
      },
    } as any);

    expect(result.tags.length).to.be.greaterThan(0);

    // Verificar que cada tag tiene las propiedades requeridas
    result.tags.forEach((tag) => {
      expect(tag).to.have.property("name");
      expect(tag).to.have.property("count");
      expect(tag).to.have.property("updatedAt");
      expect(tag.name).to.be.a("string");
      expect(tag.count).to.be.a("number");
      expect(tag.updatedAt).to.be.a("string");
    });
  });

  it("debe respetar el límite de 100 tags", async () => {
    const wrapped = test.wrap(getTags);
    const result = await wrapped({
      ðata: undefined,
      auth: {
        uid: testUserId,
      },
    } as any);

    expect(result.tags.length).to.be.at.most(100);
  });

  it("debe rechazar sin autenticación", async () => {
    const wrapped = test.wrap(getTags);

    try {
      await wrapped({ data: undefined } as any);
      expect.fail("Debería haber lanzado un error");
    } catch (error: any) {
      expect(error.code).to.equal("unauthenticated");
    }
  });

  it("debe retornar array vacío si no hay tags", async () => {
    // Temporalmente eliminar todos los tags
    const tagsSnapshot = await db.collection("tags").get();
    const batch = db.batch();
    tagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    const wrapped = test.wrap(getTags);
    const result = await wrapped({
      data: undefined, uth: {
        uid: testUserId,
      },
    } as any);

    expect(result.tags).to.be.an("array");
    expect(result.tags.length).to.equal(0);
    expect(result.total).to.equal(0);

    // Restaurar los tags
    const now = admin.firestore.Timestamp.now();
    await db.collection("tags").add({
      name: "javascript",
      count: 50,
      updatedAt: now,
    });
    await db.collection("tags").add({
      name: "react",
      count: 30,
      updatedAt: now,
    });
    await db.collection("tags").add({
      name: "typescript",
      count: 10,
      updatedAt: now,
    });
  });
});
