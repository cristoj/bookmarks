/**
 * Script para actualizar URLs firmadas a URLs públicas simples
 */
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: 'bookmarks-cristoj',
  storageBucket: 'bookmarks-cristoj.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function fixScreenshotUrls() {
  console.log('Iniciando actualización de URLs de screenshots...\n');

  try {
    // Obtener todos los bookmarks
    const snapshot = await db.collection('bookmarks').get();

    console.log(`Encontrados ${snapshot.size} bookmarks\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const screenshotUrl = data.screenshotUrl;

      // Si no tiene screenshotUrl o no tiene screenshotPath, saltar
      if (!screenshotUrl || !data.screenshotPath) {
        skippedCount++;
        continue;
      }

      // Si la URL contiene "Expires" o "Signature", es una signed URL
      if (screenshotUrl.includes('Expires') || screenshotUrl.includes('Signature')) {
        try {
          // Generar URL pública simple
          const encodedPath = encodeURIComponent(data.screenshotPath);
          const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

          // Actualizar el documento
          await doc.ref.update({
            screenshotUrl: newUrl
          });

          console.log(`✓ ${doc.id}: ${data.title.substring(0, 50)}...`);
          updatedCount++;
        } catch (error) {
          console.error(`✗ ${doc.id}: ${error.message}`);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Actualizados: ${updatedCount}`);
    console.log(`   - Omitidos: ${skippedCount}`);
    console.log(`   - Errores: ${errorCount}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixScreenshotUrls();
