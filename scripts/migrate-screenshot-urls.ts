/**
 * Script para migrar URLs firmadas a URLs públicas en screenshots
 *
 * Este script actualiza todos los bookmarks que tienen screenshots
 * convirtiendo las signed URLs (que caducan) a URLs públicas permanentes.
 *
 * IMPORTANTE: Las Storage Rules deben permitir lectura pública para que funcione
 * (esto ya está configurado en storage.rules)
 *
 * Uso:
 *   npm run migrate-screenshot-urls
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Buscar credenciales
function findCredentialsFile(): string | null {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, '../firebase-credentials.json'),
    path.join(__dirname, '../bookmarks-cristoj-firebase-adminsdk-fbsvc-92d5aee468.json'),
  ];

  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  const serviceAccountFile = files.find(f =>
    f.includes('service-account') || f.includes('firebase-adminsdk')
  );
  if (serviceAccountFile) {
    possiblePaths.push(path.join(rootDir, serviceAccountFile));
  }

  for (const credPath of possiblePaths) {
    if (credPath && fs.existsSync(credPath)) {
      return credPath;
    }
  }
  return null;
}

const credentialsPath = findCredentialsFile();

if (credentialsPath) {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket: 'bookmarks-cristoj.firebasestorage.app',
  });
  console.log(`✅ Usando credenciales desde: ${path.basename(credentialsPath)}\n`);
} else {
  console.error('❌ No se encontraron credenciales de Firebase');
  process.exit(1);
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

/**
 * Genera una URL pública para un archivo de Storage
 */
function generatePublicUrl(storagePath: string, bucketName: string): string {
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

/**
 * Verifica si una URL es una signed URL (tiene token)
 */
function isSignedUrl(url: string): boolean {
  return url.includes('token=') || url.includes('Expires=');
}

async function main() {
  console.log('🔄 Migrando URLs de screenshots a formato público...\n');

  // Obtener todos los bookmarks que tienen screenshot
  const snapshot = await db
    .collection('bookmarks')
    .where('screenshotStatus', '==', 'completed')
    .get();

  console.log(`📊 Bookmarks con screenshot encontrados: ${snapshot.size}\n`);

  if (snapshot.size === 0) {
    console.log('✅ No hay bookmarks con screenshots para migrar\n');
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500; // Límite de Firestore

  // Procesar cada bookmark
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const bookmarkId = doc.id;

    // Verificar que tenga screenshotPath
    if (!data.screenshotPath) {
      console.log(`⚠️  Bookmark ${bookmarkId} no tiene screenshotPath, omitiendo`);
      skipped++;
      continue;
    }

    // Verificar si ya tiene una URL pública (no es signed URL)
    if (data.screenshotUrl && !isSignedUrl(data.screenshotUrl)) {
      console.log(`✓ Bookmark ${bookmarkId} ya tiene URL pública, omitiendo`);
      skipped++;
      continue;
    }

    try {
      // Generar nueva URL pública
      const publicUrl = generatePublicUrl(data.screenshotPath, bucket.name);

      // Añadir al batch
      batch.update(doc.ref, {
        screenshotUrl: publicUrl,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      batchCount++;
      updated++;

      console.log(`✅ Migrando ${bookmarkId}`);
      console.log(`   Vieja URL: ${data.screenshotUrl?.substring(0, 80)}...`);
      console.log(`   Nueva URL: ${publicUrl.substring(0, 80)}...\n`);

      // Ejecutar batch si alcanzamos el límite
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`💾 Batch de ${batchCount} actualizaciones guardado\n`);
        batchCount = 0;
      }
    } catch (error) {
      console.error(`❌ Error al procesar bookmark ${bookmarkId}:`, error);
      errors++;
    }
  }

  // Ejecutar último batch si hay operaciones pendientes
  if (batchCount > 0) {
    await batch.commit();
    console.log(`💾 Último batch de ${batchCount} actualizaciones guardado\n`);
  }

  console.log(`\n✨ Migración completada!`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`   ❌ Errores: ${errors}\n`);

  if (updated > 0) {
    console.log('🎉 Las URLs ahora son públicas y no caducarán nunca.');
    console.log('   Puedes verificar accediendo a cualquier screenshot desde el navegador.\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
