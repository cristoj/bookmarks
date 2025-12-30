/**
 * Cloud Functions for Firebase
 *
 * Este archivo inicializa firebase-admin y exporta todas las funciones
 */

import * as admin from "firebase-admin";
import {setGlobalOptions} from "firebase-functions/v2";

// Inicializar Firebase Admin
admin.initializeApp();

// Configuración global para control de costos (sin region para permitir triggers regionales)
setGlobalOptions({
  maxInstances: 10,
});

// Exportar funciones de bookmarks
export {createBookmark} from "./bookmarks/create";
export {getBookmarks} from "./bookmarks/get";
export {getBookmarksCount} from "./bookmarks/count";
export {updateBookmark} from "./bookmarks/update";
export {deleteBookmark} from "./bookmarks/delete";
export {getTags} from "./bookmarks/tags";
export {getPageMetadata} from "./bookmarks/metadata";

// Exportar funciones de screenshots
export {captureScreenshot} from "./screenshots/capture";
export {retryFailedScreenshots} from "./screenshots/retry";
export {onBookmarkCreated} from "./screenshots/trigger";

// Exportar funciones de mantenimiento
export {fixScreenshotUrls} from "./maintenance/fix-urls";
