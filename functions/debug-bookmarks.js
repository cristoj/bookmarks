/**
 * Script para debuggear bookmarks en el emulador de Firestore
 */

const admin = require('firebase-admin');

// Configurar variables de entorno para usar emuladores
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "bookmarks-cristoj";

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: "bookmarks-cristoj",
});

async function debugBookmarks() {
  const db = admin.firestore();

  console.log('\n=== BOOKMARKS EN FIRESTORE ===\n');

  try {
    const snapshot = await db.collection('bookmarks').orderBy('createdAt', 'desc').limit(5).get();

    if (snapshot.empty) {
      console.log('❌ No hay bookmarks en la colección\n');
      return;
    }

    console.log(`✅ Últimos ${snapshot.size} bookmarks:\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  - title: "${data.title}"`);
      console.log(`  - url: "${data.url}"`);
      console.log(`  - tags: [${data.tags?.join(', ') || ''}]`);
      console.log(`  - userId: ${data.userId}`);
      console.log(`  - createdAt: ${data.createdAt?.toDate().toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error al leer bookmarks:', error.message);
  }

  process.exit(0);
}

debugBookmarks();
