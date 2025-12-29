/**
 * Script de importación de bookmarks desde archivo JSON
 *
 * Uso:
 *   npm run import-bookmarks -- --limit=1
 *   npm run import-bookmarks -- --limit=10
 *   npm run import-bookmarks  (procesa todos)
 *
 * IMPORTANTE: Antes de ejecutar, asegúrate de estar autenticado:
 *   firebase login
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuración
const USER_ID = 'NIAi6T69C7Sbc63G9og7i4XuHC62';
const JSON_PATH = path.join(__dirname, '../docs/bookmarks_marcador.json');
const SCREENSHOTS_DIR = path.join(__dirname, '../docs/screenshot');
const LOG_PATH = path.join(__dirname, '../scripts/import-log.json');

// Inicializar Firebase Admin
// Buscar archivo de credenciales automáticamente
function findCredentialsFile(): string | null {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, '../firebase-credentials.json'),
    path.join(__dirname, '../bookmarks-cristoj-firebase-adminsdk-fbsvc-92d5aee468.json'),
  ];

  // Buscar también cualquier archivo service-account en la raíz
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
  console.error('\nPor favor descarga las credenciales desde:');
  console.error('https://console.firebase.google.com/project/bookmarks-cristoj/settings/serviceaccounts/adminsdk');
  console.error('\nY guárdalas como firebase-credentials.json en la raíz del proyecto\n');
  process.exit(1);
}

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket('bookmarks-cristoj.firebasestorage.app');

interface BookmarkJSON {
  url: string;
  titulo: string;
  descripcion: string;
  tags: string;
  img: string;
  fecha: string;
}

interface ImportLog {
  timestamp: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  bookmarks: Array<{
    url: string;
    title: string;
    success: boolean;
    error?: string;
    screenshotUploaded: boolean;
    skipped?: boolean;
    skipReason?: string;
  }>;
}

/**
 * Sube una imagen a Firebase Storage
 */
async function uploadScreenshot(
  imgNumber: string,
  userId: string
): Promise<{ url: string | null; path: string | null }> {
  const extensions = ['.jpg', '.jpeg', '.png', '.gif'];

  // Buscar el archivo con cualquier extensión
  let screenshotPath: string | null = null;
  for (const ext of extensions) {
    const testPath = path.join(SCREENSHOTS_DIR, `${imgNumber}${ext}`);
    if (fs.existsSync(testPath)) {
      screenshotPath = testPath;
      break;
    }
  }

  // Si no existe la imagen, retornar null
  if (!screenshotPath) {
    console.log(`  ⚠️  Imagen ${imgNumber} no encontrada`);
    return { url: null, path: null };
  }

  try {
    // Generar nombre único para el archivo
    const extension = path.extname(screenshotPath);
    const fileName = `${uuidv4()}${extension}`;
    const storagePath = `screenshots/${userId}/${fileName}`;

    // Subir archivo
    await bucket.upload(screenshotPath, {
      destination: storagePath,
      metadata: {
        contentType: `image/${extension.substring(1)}`,
        metadata: {
          importedFrom: imgNumber,
        },
      },
    });

    // Obtener URL pública
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Fecha muy lejana
    });

    console.log(`  ✅ Screenshot subida: ${storagePath}`);
    return { url, path: storagePath };
  } catch (error) {
    console.error(`  ❌ Error subiendo screenshot ${imgNumber}:`, error);
    return { url: null, path: null };
  }
}

/**
 * Convierte fecha del formato "2014-02-11 08:50:26" a Timestamp de Firestore
 */
function parseDate(dateStr: string): admin.firestore.Timestamp {
  const date = new Date(dateStr);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Procesa tags desde string separado por comas a array
 */
function processTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr.trim() === '') {
    return [];
  }
  return tagsStr
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Verifica si el bookmark debe ser excluido por sus tags
 */
function shouldSkipBookmark(tagsStr: string): boolean {
  const excludedTags = ['jquery'];
  const tags = tagsStr.toLowerCase().split(',').map(t => t.trim());

  return excludedTags.some(excludedTag => tags.includes(excludedTag));
}

/**
 * Importa un bookmark
 */
async function importBookmark(bookmarkData: BookmarkJSON): Promise<{
  success: boolean;
  error?: string;
  screenshotUploaded: boolean;
  skipped?: boolean;
  skipReason?: string;
}> {
  try {
    const { url, titulo, descripcion, tags, img, fecha } = bookmarkData;

    // Verificar si debe ser excluido por tags
    if (shouldSkipBookmark(tags)) {
      console.log(`  ⏭️  Omitido por tag excluido (jquery)`);
      return {
        success: false,
        screenshotUploaded: false,
        skipped: true,
        skipReason: 'Tag excluido: jquery'
      };
    }

    // Subir screenshot si existe
    const screenshot = await uploadScreenshot(img, USER_ID);

    // Preparar datos del bookmark
    const tagsArray = processTags(tags);
    const timestamp = parseDate(fecha);

    const bookmark = {
      userId: USER_ID,
      url: url,
      title: titulo || '-',
      description: descripcion || '-',
      tags: tagsArray,
      folderId: null,
      screenshotUrl: screenshot.url,
      screenshotPath: screenshot.path,
      screenshotStatus: 'completed',
      screenshotRetries: 0,
      screenshotError: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Crear documento en Firestore
    await db.collection('bookmarks').add(bookmark);

    // Actualizar contadores de tags
    if (tagsArray.length > 0) {
      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      for (const tag of tagsArray) {
        const tagRef = db.collection('tags').doc(tag);
        batch.set(
          tagRef,
          {
            name: tag,
            count: admin.firestore.FieldValue.increment(1),
            updatedAt: now,
          },
          { merge: true }
        );
      }

      await batch.commit();
    }

    console.log(`  ✅ Bookmark creado: ${titulo}`);
    return { success: true, screenshotUploaded: screenshot.url !== null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Error creando bookmark:`, errorMsg);
    return { success: false, error: errorMsg, screenshotUploaded: false };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando importación de bookmarks...\n');

  // Leer argumentos de línea de comandos
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

  // Leer archivo JSON
  console.log(`📖 Leyendo archivo: ${JSON_PATH}`);
  const jsonContent = fs.readFileSync(JSON_PATH, 'utf-8');
  const bookmarks: BookmarkJSON[] = JSON.parse(jsonContent);

  const totalBookmarks = limit ? Math.min(limit, bookmarks.length) : bookmarks.length;
  console.log(`📊 Total de bookmarks a procesar: ${totalBookmarks} de ${bookmarks.length}\n`);

  // Procesar bookmarks
  const importLog: ImportLog = {
    timestamp: new Date().toISOString(),
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    bookmarks: [],
  };

  for (let i = 0; i < totalBookmarks; i++) {
    const bookmark = bookmarks[i];
    console.log(`[${i + 1}/${totalBookmarks}] Procesando: ${bookmark.titulo || bookmark.url}`);

    const result = await importBookmark(bookmark);

    importLog.totalProcessed++;
    if (result.skipped) {
      importLog.skipped++;
    } else if (result.success) {
      importLog.successful++;
    } else {
      importLog.failed++;
    }

    importLog.bookmarks.push({
      url: bookmark.url,
      title: bookmark.titulo,
      success: result.success,
      error: result.error,
      screenshotUploaded: result.screenshotUploaded,
      skipped: result.skipped,
      skipReason: result.skipReason,
    });

    console.log(''); // Línea en blanco para separar
  }

  // Guardar log
  console.log(`💾 Guardando log en: ${LOG_PATH}`);
  fs.writeFileSync(LOG_PATH, JSON.stringify(importLog, null, 2));

  // Resumen
  console.log('\n✨ Importación completada!');
  console.log(`   Total procesados: ${importLog.totalProcessed}`);
  console.log(`   ✅ Exitosos: ${importLog.successful}`);
  console.log(`   ⏭️  Omitidos: ${importLog.skipped}`);
  console.log(`   ❌ Fallidos: ${importLog.failed}`);
  console.log(`   📄 Log guardado en: ${LOG_PATH}\n`);

  process.exit(0);
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
