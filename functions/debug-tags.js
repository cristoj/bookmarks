/**
 * Script para debuggear tags en el emulador de Firestore
 */

const admin = require('firebase-admin');

// Configurar variables de entorno para usar emuladores
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "bookmarks-cristoj";

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: "bookmarks-cristoj",
});

async function debugTags() {
  const db = admin.firestore();

  console.log('\n=== TAGS EN FIRESTORE ===\n');

  try {
    const snapshot = await db.collection('tags').get();

    if (snapshot.empty) {
      console.log('❌ No hay tags en la colección\n');
      return;
    }

    console.log(`✅ Encontrados ${snapshot.size} tags:\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Document ID: "${doc.id}"`);
      console.log(`  - name: "${data.name || 'N/A'}"`);
      console.log(`  - count: ${data.count || 0}`);
      console.log(`  - updatedAt: ${data.updatedAt?.toDate().toISOString() || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error al leer tags:', error.message);
  }

  process.exit(0);
}

debugTags();
