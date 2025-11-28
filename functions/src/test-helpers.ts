/**
 * Test helpers para Cloud Functions
 *
 * Configura el entorno de test para usar los emuladores de Firebase
 */

import * as admin from "firebase-admin";
import functionsTest from "firebase-functions-test";

// Configurar variables de entorno ANTES de importar o usar firebase-admin
// Esto hace que firebase-admin se conecte a los emuladores en lugar de la nube
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
process.env.GCLOUD_PROJECT = "test-project";

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
    storageBucket: "test-project.appspot.com",
  });
}

// Inicializar firebase-functions-test
export const test = functionsTest(
  {
    projectId: "test-project",
  },
  // Path a un service account fake (no se usa porque estamos en modo emulador)
  undefined
);
