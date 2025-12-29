/**
 * Script para eliminar bookmarks de prueba
 *
 * CUIDADO: Este script elimina TODOS los bookmarks del usuario especificado
 *
 * Uso:
 *   npm run cleanup-bookmarks
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const USER_ID = 'NIAi6T69C7Sbc63G9og7i4XuHC62';

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
  });
  console.log(`✅ Usando credenciales desde: ${path.basename(credentialsPath)}\n`);
} else {
  console.error('❌ No se encontraron credenciales de Firebase');
  process.exit(1);
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket('bookmarks-cristoj.firebasestorage.app');

async function main() {
  console.log('🗑️  Limpiando bookmarks de prueba...\n');
  console.log(`👤 Usuario: ${USER_ID}\n`);

  // Obtener todos los bookmarks del usuario
  const snapshot = await db
    .collection('bookmarks')
    .where('userId', '==', USER_ID)
    .get();

  console.log(`📊 Bookmarks encontrados: ${snapshot.size}\n`);

  if (snapshot.size === 0) {
    console.log('✅ No hay bookmarks para eliminar\n');
    process.exit(0);
  }

  let deleted = 0;
  let screenshotsDeleted = 0;

  // Eliminar bookmarks y screenshots
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Eliminando: ${data.title || data.url}`);

    // Eliminar screenshot de Storage si existe
    if (data.screenshotPath) {
      try {
        await bucket.file(data.screenshotPath).delete();
        screenshotsDeleted++;
        console.log(`  ✅ Screenshot eliminada: ${data.screenshotPath}`);
      } catch (error) {
        console.log(`  ⚠️  Screenshot no encontrada o ya eliminada`);
      }
    }

    // Eliminar documento de Firestore
    await doc.ref.delete();
    deleted++;
  }

  console.log(`\n✨ Limpieza completada!`);
  console.log(`   📄 Bookmarks eliminados: ${deleted}`);
  console.log(`   🖼️  Screenshots eliminadas: ${screenshotsDeleted}\n`);

  // Nota sobre tags
  console.log('⚠️  NOTA: Los contadores de tags NO se han actualizado.');
  console.log('   Si quieres resetear los tags también, hazlo manualmente desde Firebase Console.\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
