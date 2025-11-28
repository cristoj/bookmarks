import * as admin from "firebase-admin";
import {logger} from "firebase-functions/v2";
// import puppeteer, {Browser, Page} from "puppeteer";
import puppeteer from "puppeteer-core";
import {Browser, LaunchOptions, Page} from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {v4 as uuidv4} from "uuid";
import {Timestamp} from "firebase-admin/firestore";

// Interface para la lógica interna
export interface CaptureLogicParams {
  bookmarkId: string;
  url: string;
  userId: string;
}

/**
 * Lógica pura para capturar screenshot y actualizar Firestore/Storage.
 * NO es una Cloud Function (no usa onCall ni onRequest).
 */
export async function internalCaptureLogic({
  bookmarkId,
  url,
  userId,
}: CaptureLogicParams): Promise<void> {
  // Inicializar Firestore y Storage
  const db = admin.firestore();
  const bookmarkRef = db.collection("bookmarks").doc(bookmarkId);

  // OMITIMOS LA VERIFICACIÓN DE AUTH Y VALIDACIÓN DE PARÁMETROS AQUÍ,
  // YA QUE FUE HECHA POR LA FUNCIÓN LLAMADORA.

  let browser: Browser | null = null;

  try {
    logger.info(`[Logic] Iniciando captura para bookmark ${bookmarkId}`, {
      url,
      userId,
    });

    // Actualizar estado a 'processing'
    await bookmarkRef.update({
      screenshotStatus: "processing",
      updatedAt: Timestamp.now(),
    });

    // --- Lógica de Puppeteer ---
    // Configuración optimizada para Cloud Functions
    /*
    browser = await puppeteer.launch({
      headless: true,
      // Usar Chrome preinstalado en Cloud Functions
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
      args: [
        // Seguridad y permisos (requerido para Cloud Functions)
        "--no-sandbox",
        "--disable-setuid-sandbox",

        // Optimización de memoria (crítico para Cloud Functions)
        "--disable-dev-shm-usage", // Usa /tmp en lugar de /dev/shm (memoria compartida limitada)
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",

        // Rendimiento
        "--single-process", // Usa un solo proceso (reduce memoria)
        "--no-zygote", // Desactiva proceso zygote
        "--disable-web-security", // Permite capturas de sitios con CORS estricto

        // Reduce detección de headless browser
        "--disable-blink-features=AutomationControlled",

        // Tamaño de ventana
        "--window-size=1280x720",

        // Optimización adicional
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-component-extensions-with-background-pages",
        "--disable-extensions",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--enable-features=NetworkService,NetworkServiceInProcess",
        "--force-color-profile=srgb",
        "--hide-scrollbars",
        "--metrics-recording-only",
        "--mute-audio",
      ],
    });
    */
    const executablePath = await chromium.executablePath();
    const launchOptions: LaunchOptions = {
      args: chromium.args,
      executablePath: executablePath,
      headless: true,
      defaultViewport: {width: 1920, height: 900},
    };
    browser = await puppeteer.launch(launchOptions);
    const page: Page = await browser.newPage();

    // Configurar viewport
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    });

    // Configurar User Agent (evita bloqueos)
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navegar a la URL
    // Usamos 'domcontentloaded' en lugar de 'networkidle2' (más rápido y confiable)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Esperar 2 segundos para contenido dinámico
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Capturar screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    await page.close();

    // --- Lógica de Storage ---
    const filename = `${uuidv4()}.png`;
    const storagePath = `screenshots/${userId}/${filename}`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    await file.save(screenshot, {
      metadata: {
        contentType: "image/png",
        metadata: {
          bookmarkId,
          capturedAt: new Date().toISOString(),
          userId,
        },
      },
    });

    // Generar URL: emulador local vs producción
    let screenshotUrl: string;
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

    if (isEmulator) {
      // En emulador, usar URL del emulador local de Storage
      // Formato: http://127.0.0.1:9199/v0/b/{bucket}/o/{encodedPath}?alt=media
      const encodedPath = encodeURIComponent(storagePath);
      screenshotUrl = `http://127.0.0.1:9199/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      logger.info("[Logic] Usando URL del emulador local", {screenshotUrl});
    } else {
      // En producción, usar signed URL
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 años
      });
      screenshotUrl = signedUrl;
      logger.info("[Logic] Usando signed URL para producción");
    }

    // --- Actualización Final ---
    await bookmarkRef.update({
      screenshotUrl,
      screenshotPath: storagePath,
      screenshotStatus: "completed",
      screenshotError: null,
      updatedAt: Timestamp.now(),
    });

    logger.info(`[Logic] Captura exitosa para bookmark ${bookmarkId}`);
  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string };
    logger.error(`[Logic] Error al capturar screenshot para ${bookmarkId}`, {
      error: err.message,
    });

    // Actualizar bookmark con el error
    await bookmarkRef.update({
      screenshotUrl: null,
      screenshotStatus: "failed",
      screenshotError: err.message || "Error desconocido en la lógica de captura",
      updatedAt: Timestamp.now(),
    });
  } finally {
    if (browser) {
      await browser.close();
      logger.info("[Logic] Browser cerrado correctamente");
    }
  }
}
