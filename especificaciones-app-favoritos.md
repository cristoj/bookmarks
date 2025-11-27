# Especificaciones Técnicas - App Agregador de Favoritos Web

## 📋 Resumen del Proyecto

Aplicación web personal para gestionar y organizar páginas web favoritas con sistema de autenticación, búsqueda avanzada y visualización en cards con capturas de pantalla.

---

## 🎯 Stack Tecnológico Recomendado

### Frontend
- **Framework**: React 18+ con Vite
- **Lenguaje**: TypeScript
- **UI Components**: shadcn/ui o Tailwind CSS
- **Estado**: React Query + Context API
- **Formularios**: React Hook Form + Zod
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20+ 
- **Framework**: Express.js o Fastify
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod

### Base de Datos
- **PostgreSQL** (recomendado para producción)
- **SQLite** (alternativa para desarrollo/uso personal)

### Servicios Externos
- **Screenshots**: 
  - **Opción 1 (Gratuita)**: ScreenshotOne (100 screenshots/mes gratis)
  - **Opción 2 (Gratuita)**: ApiFlash (100 screenshots/mes gratis)
  - **Opción 3 (Self-hosted)**: Puppeteer/Playwright en servidor
  - **Opción 4 (Simple)**: Thum.io (1000 impresiones/mes gratis)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│   React Client  │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐      ┌──────────────┐
│  Express API    │◄─────┤  Screenshot  │
│   (Backend)     │      │     API      │
└────────┬────────┘      └──────────────┘
         │
         │ Prisma ORM
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

---

## 📊 Modelo de Base de Datos (Firestore)

### Colecciones de Firestore

```typescript
// Estructura de colecciones en Firestore

// Collection: users
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: bookmarks
interface Bookmark {
  id: string;                     // Auto-generado por Firestore
  userId: string;                 // Referencia al user
  title: string;
  url: string;
  description: string | null;
  screenshotUrl: string | null;   // URL de Firebase Storage
  screenshotPath: string | null;  // Path en Storage para borrar
  tags: string[];                 // Array de strings
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: tags (para autocomplete y conteo)
interface Tag {
  id: string;                     // nombre del tag (usado como ID)
  name: string;
  count: number;                  // cuántos bookmarks lo usan
  lastUsed: Timestamp;
}
```

### Índices Compuestos Necesarios

En Firestore Console, crear estos índices:

```javascript
// Índice 1: Para búsqueda y filtrado
Collection: bookmarks
Fields:
  - userId (Ascending)
  - createdAt (Descending)

// Índice 2: Para filtro por tags
Collection: bookmarks
Fields:
  - userId (Ascending)
  - tags (Array-contains)
  - createdAt (Descending)
```

### Reglas de Seguridad (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Bookmarks collection
    match /bookmarks/{bookmarkId} {
      allow read: if isAuthenticated() && 
                     isOwner(resource.data.userId);
      allow create: if isAuthenticated() && 
                       isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && 
                               isOwner(resource.data.userId);
    }
    
    // Tags collection (read-only, updated by Cloud Functions)
    match /tags/{tagId} {
      allow read: if isAuthenticated();
      allow write: if false; // Solo Cloud Functions pueden escribir
    }
  }
}
```

### Reglas de Storage (storage.rules)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /screenshots/{userId}/{fileName} {
      allow read: if request.auth != null && 
                     request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId;
      allow delete: if request.auth != null && 
                       request.auth.uid == userId;
    }
  }
}
```

---

## 🔐 Sistema de Autenticación (Firebase Auth)

### Configuración de Firebase Auth

Firebase Authentication maneja automáticamente:
- ✅ Registro de usuarios
- ✅ Login/Logout
- ✅ Recuperación de contraseña
- ✅ Verificación de email
- ✅ Tokens JWT automáticos

### Implementación en Frontend

```typescript
// src/services/auth.service.ts
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const auth = getAuth();

export const authService = {
  // Registro
  async register(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    // Crear documento de usuario en Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      displayName,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return userCredential.user;
  },
  
  // Login
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    return userCredential.user;
  },
  
  // Logout
  async logout() {
    await signOut(auth);
  },
  
  // Recuperar contraseña
  async forgotPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  },
  
  // Observador de estado de autenticación
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
  
  // Obtener token para llamadas a Cloud Functions
  async getIdToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return await user.getIdToken();
  }
};
```

### Context Provider para Auth

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const value = {
    user,
    loading,
    login: authService.login,
    register: authService.register,
    logout: authService.logout,
    forgotPassword: authService.forgotPassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Route

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}
```

---

## 📚 Cloud Functions para Bookmarks

### Estructura de Cloud Functions

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Middleware para verificar autenticación
async function verifyAuth(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  return context.auth.uid;
}

// 1. Crear Bookmark
export const createBookmark = functions.https.onCall(async (data, context) => {
  const userId = await verifyAuth(context);
  
  const { url, title, description, tags } = data;
  
  // Validación
  if (!url || !title) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'URL and title are required'
    );
  }
  
  // Crear bookmark sin screenshot primero
  const bookmarkRef = await db.collection('bookmarks').add({
    userId,
    url,
    title,
    description: description || null,
    screenshotUrl: null,
    screenshotPath: null,
    tags: tags || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Actualizar conteo de tags
  if (tags && tags.length > 0) {
    const batch = db.batch();
    for (const tagName of tags) {
      const tagRef = db.collection('tags').doc(tagName);
      batch.set(tagRef, {
        name: tagName,
        count: admin.firestore.FieldValue.increment(1),
        lastUsed: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
  
  // Trigger captura de screenshot (async)
  await captureScreenshot({ bookmarkId: bookmarkRef.id, url });
  
  return { id: bookmarkRef.id, ...data };
});

// 2. Obtener Bookmarks con Paginación
export const getBookmarks = functions.https.onCall(async (data, context) => {
  const userId = await verifyAuth(context);
  
  const { 
    limit = 20, 
    lastDoc, 
    tags, 
    search, 
    dateFrom, 
    dateTo 
  } = data;
  
  let query = db.collection('bookmarks')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);
  
  // Paginación
  if (lastDoc) {
    const lastDocSnapshot = await db.collection('bookmarks').doc(lastDoc).get();
    query = query.startAfter(lastDocSnapshot);
  }
  
  // Filtros
  if (tags && tags.length > 0) {
    query = query.where('tags', 'array-contains-any', tags);
  }
  
  if (dateFrom) {
    query = query.where('createdAt', '>=', new Date(dateFrom));
  }
  
  if (dateTo) {
    query = query.where('createdAt', '<=', new Date(dateTo));
  }
  
  const snapshot = await query.get();
  const bookmarks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Filtro de búsqueda en cliente (Firestore no soporta full-text)
  let filteredBookmarks = bookmarks;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredBookmarks = bookmarks.filter(b => 
      b.title?.toLowerCase().includes(searchLower) ||
      b.description?.toLowerCase().includes(searchLower)
    );
  }
  
  return {
    data: filteredBookmarks,
    lastDoc: snapshot.docs[snapshot.docs.length - 1]?.id || null,
    hasMore: snapshot.docs.length === limit
  };
});

// 3. Actualizar Bookmark
export const updateBookmark = functions.https.onCall(async (data, context) => {
  const userId = await verifyAuth(context);
  
  const { bookmarkId, title, description, tags } = data;
  
  if (!bookmarkId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Bookmark ID is required'
    );
  }
  
  const bookmarkRef = db.collection('bookmarks').doc(bookmarkId);
  const bookmark = await bookmarkRef.get();
  
  if (!bookmark.exists || bookmark.data()?.userId !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bookmark not found or access denied'
    );
  }
  
  const oldTags = bookmark.data()?.tags || [];
  const newTags = tags || oldTags;
  
  // Actualizar bookmark
  await bookmarkRef.update({
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(tags && { tags }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Actualizar conteo de tags si cambiaron
  if (tags && JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
    await updateTagCounts(oldTags, newTags);
  }
  
  return { success: true };
});

// 4. Eliminar Bookmark
export const deleteBookmark = functions.https.onCall(async (data, context) => {
  const userId = await verifyAuth(context);
  
  const { bookmarkId } = data;
  
  if (!bookmarkId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Bookmark ID is required'
    );
  }
  
  const bookmarkRef = db.collection('bookmarks').doc(bookmarkId);
  const bookmark = await bookmarkRef.get();
  
  if (!bookmark.exists || bookmark.data()?.userId !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Bookmark not found or access denied'
    );
  }
  
  const bookmarkData = bookmark.data();
  
  // Eliminar screenshot de Storage si existe
  if (bookmarkData?.screenshotPath) {
    try {
      await storage.bucket().file(bookmarkData.screenshotPath).delete();
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  }
  
  // Actualizar conteo de tags
  if (bookmarkData?.tags && bookmarkData.tags.length > 0) {
    await updateTagCounts(bookmarkData.tags, []);
  }
  
  // Eliminar bookmark
  await bookmarkRef.delete();
  
  return { success: true };
});

// 5. Obtener Tags
export const getTags = functions.https.onCall(async (data, context) => {
  await verifyAuth(context);
  
  const snapshot = await db.collection('tags')
    .orderBy('count', 'desc')
    .limit(100)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
});

// Helper: Actualizar conteos de tags
async function updateTagCounts(oldTags: string[], newTags: string[]) {
  const batch = db.batch();
  
  // Decrementar tags removidos
  const removedTags = oldTags.filter(t => !newTags.includes(t));
  for (const tag of removedTags) {
    const tagRef = db.collection('tags').doc(tag);
    batch.update(tagRef, {
      count: admin.firestore.FieldValue.increment(-1)
    });
  }
  
  // Incrementar tags nuevos
  const addedTags = newTags.filter(t => !oldTags.includes(t));
  for (const tag of addedTags) {
    const tagRef = db.collection('tags').doc(tag);
    batch.set(tagRef, {
      name: tag,
      count: admin.firestore.FieldValue.increment(1),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  await batch.commit();
}
```

### Llamadas desde Frontend

```typescript
// src/services/bookmarks.service.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const bookmarksService = {
  async create(data: { url: string; title: string; description?: string; tags?: string[] }) {
    const createBookmark = httpsCallable(functions, 'createBookmark');
    const result = await createBookmark(data);
    return result.data;
  },
  
  async getAll(filters: { 
    limit?: number; 
    lastDoc?: string; 
    tags?: string[];
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const getBookmarks = httpsCallable(functions, 'getBookmarks');
    const result = await getBookmarks(filters);
    return result.data;
  },
  
  async update(bookmarkId: string, data: { 
    title?: string; 
    description?: string; 
    tags?: string[] 
  }) {
    const updateBookmark = httpsCallable(functions, 'updateBookmark');
    const result = await updateBookmark({ bookmarkId, ...data });
    return result.data;
  },
  
  async delete(bookmarkId: string) {
    const deleteBookmark = httpsCallable(functions, 'deleteBookmark');
    const result = await deleteBookmark({ bookmarkId });
    return result.data;
  },
  
  async getTags() {
    const getTags = httpsCallable(functions, 'getTags');
    const result = await getTags();
    return result.data;
  }
};
```

---

## 🎨 Diseño Visual - Especificaciones UI/UX

### Paleta de Colores

```css
:root {
  /* Tema Claro */
  --primary: #3b82f6;      /* Blue */
  --secondary: #64748b;    /* Slate */
  --background: #ffffff;
  --card: #f8fafc;
  --text: #0f172a;
  --border: #e2e8f0;
  --success: #22c55e;
  --error: #ef4444;
  
  /* Tema Oscuro (opcional) */
  --dark-primary: #60a5fa;
  --dark-background: #0f172a;
  --dark-card: #1e293b;
  --dark-text: #f1f5f9;
  --dark-border: #334155;
}
```

### Componente Card de Bookmark

```
┌────────────────────────────────────┐
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     Screenshot (16:9)        │  │ 
│  │     320x180px                │  │
│  │     Link interactivo         │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌─ Título (Heading)              │
│  │  Link interactivo              │
│  └─────────────────────────────   │
│                                    │
│  📅 Fecha: 26 Nov 2024             │
│                                    │
│  Descripción: Lorem ipsum dolor    │
│  sit amet consectetur...           │
│                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ Tag1│ │ Tag2│ │ Tag3│          │
│  └─────┘ └─────┘ └─────┘          │
│                                    │
│  [✏️ Editar] [🗑️ Eliminar]         │
└────────────────────────────────────┘
```

### Layout de la Aplicación

```
┌─────────────────────────────────────────────┐
│  Header                                     │
│  Logo | Buscador | [+ Nuevo] | [Logout]    │
├─────────────────────────────────────────────┤
│                                             │
│  Filtros: [Tags Chosen] [Fecha] [Buscar]  │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐             │
│  │Card 1│  │Card 2│  │Card 3│             │
│  └──────┘  └──────┘  └──────┘             │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐             │
│  │Card 4│  │Card 5│  │Card 6│             │
│  └──────┘  └──────┘  └──────┘             │
│                                             │
│  [Loading más cards...]                     │
└─────────────────────────────────────────────┘
```

### Responsive Breakpoints

```css
/* Mobile First */
- Mobile: < 640px (1 columna)
- Tablet: 640px - 1024px (2 columnas)
- Desktop: > 1024px (3 columnas)
```

---

## 🔍 Sistema de Búsqueda y Filtros

### Componente de Búsqueda

```typescript
interface SearchFilters {
  query: string;           // Busca en title y description
  tags: string[];          // Filtro por tags (multi-select)
  dateFrom: Date | null;   // Fecha desde
  dateTo: Date | null;     // Fecha hasta
}

// Query SQL generada (con Prisma)
where: {
  AND: [
    {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    { tags: { some: { name: { in: tags } } } },
    { createdAt: { gte: dateFrom, lte: dateTo } }
  ]
}
```

### Scroll Infinito

```typescript
// Hook personalizado
const useInfiniteBookmarks = (filters: SearchFilters) => {
  const { data, fetchNextPage, hasNextPage, isLoading } = 
    useInfiniteQuery({
      queryKey: ['bookmarks', filters],
      queryFn: ({ pageParam = null }) => 
        fetchBookmarks({ ...filters, cursor: pageParam }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  // Intersection Observer para detectar scroll
  const observerTarget = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return { data, observerTarget, isLoading };
};
```

---

## 📸 Sistema de Screenshots con Cloud Functions

### Cloud Function para Captura de Screenshots

```typescript
// functions/src/screenshots/captureScreenshot.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

const db = admin.firestore();
const storage = admin.storage();

// Cloud Function para capturar screenshot
export const captureScreenshot = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '1GB'
  })
  .https.onCall(async (data, context) => {
    const { bookmarkId, url } = data;
    
    if (!bookmarkId || !url) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'bookmarkId and url are required'
      );
    }
    
    let browser;
    
    try {
      // Iniciar Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Configurar viewport
      await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1
      });
      
      // Configurar timeout y user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
      
      // Navegar a la URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Esperar un poco más para asegurar que todo se cargó
      await page.waitForTimeout(2000);
      
      // Capturar screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false
      });
      
      await browser.close();
      browser = null;
      
      // Obtener userId del bookmark
      const bookmarkDoc = await db.collection('bookmarks').doc(bookmarkId).get();
      if (!bookmarkDoc.exists) {
        throw new Error('Bookmark not found');
      }
      
      const userId = bookmarkDoc.data()?.userId;
      if (!userId) {
        throw new Error('Invalid bookmark data');
      }
      
      // Generar nombre único para el archivo
      const fileName = `${uuidv4()}.png`;
      const filePath = `screenshots/${userId}/${fileName}`;
      
      // Subir a Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      await file.save(screenshot, {
        metadata: {
          contentType: 'image/png',
          metadata: {
            bookmarkId,
            capturedAt: new Date().toISOString()
          }
        }
      });
      
      // Hacer el archivo público (opcional, según tus necesidades de seguridad)
      // await file.makePublic();
      
      // Obtener URL de descarga con token
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Fecha muy lejana
      });
      
      // Actualizar bookmark con URL del screenshot
      await db.collection('bookmarks').doc(bookmarkId).update({
        screenshotUrl: url,
        screenshotPath: filePath,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        screenshotUrl: url,
        screenshotPath: filePath
      };
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      
      // Actualizar bookmark indicando que falló la captura
      await db.collection('bookmarks').doc(bookmarkId).update({
        screenshotUrl: null,
        screenshotPath: null,
        screenshotError: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // No lanzar error para no bloquear la creación del bookmark
      return {
        success: false,
        error: error.message
      };
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

// Función para reintentar captura de screenshots fallidos
export const retryFailedScreenshots = functions
  .pubsub.schedule('every 24 hours')
  .onRun(async (context) => {
    // Buscar bookmarks sin screenshot y con menos de 3 intentos
    const snapshot = await db.collection('bookmarks')
      .where('screenshotUrl', '==', null)
      .where('screenshotRetries', '<', 3)
      .limit(50)
      .get();
    
    const promises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      try {
        await captureScreenshot({
          bookmarkId: doc.id,
          url: data.url
        }, {} as any);
        
      } catch (error) {
        console.error(`Failed retry for ${doc.id}:`, error);
        
        // Incrementar contador de reintentos
        await doc.ref.update({
          screenshotRetries: admin.firestore.FieldValue.increment(1)
        });
      }
    });
    
    await Promise.all(promises);
    
    return null;
  });
```

### package.json para Cloud Functions

```json
{
  "name": "bookmarks-functions",
  "version": "1.0.0",
  "main": "lib/index.js",
  "engines": {
    "node": "18"
  },
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "puppeteer": "^21.6.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3"
  },
  "private": true
}
```

### Consideraciones Importantes

**Límites de Cloud Functions (Plan Spark - Gratis):**
- ✅ 2M invocaciones/mes
- ✅ 400K GB-s/mes de tiempo de cómputo
- ✅ 5GB de salida de red/mes
- ⚠️ Puppeteer consume ~0.4 GB-s por screenshot
- ⚠️ Con 400K GB-s puedes capturar ~1000 screenshots/mes en el plan gratuito

**Para más screenshots, considera:**
1. **Upgrade a Blaze Plan** (pay-as-you-go): ~$0.40 por 1M GB-s adicionales
2. **Usar una API externa** como ApiFlash para screenshots frecuentes
3. **Implementar caché** de screenshots para URLs repetidas

### Alternativa: Híbrido (Puppeteer + API Externa)

```typescript
// Usar Puppeteer para primeros 100 screenshots/mes, luego API externa
const MONTHLY_SCREENSHOT_LIMIT = 100;

async function captureWithFallback(url: string) {
  const count = await getMonthlyScreenshotCount();
  
  if (count < MONTHLY_SCREENSHOT_LIMIT) {
    // Usar Puppeteer (gratis)
    return await captureWithPuppeteer(url);
  } else {
    // Usar ApiFlash (después del límite)
    return await captureWithApiFlash(url);
  }
}
```

---

## 🚀 Alojamiento: Firebase (Todo en Uno)

### Arquitectura: Firebase Completo

**Repositorio único:** `git@github.com:cristoj/bookmarks.git`

**Firebase proporciona TODO:**

**Frontend (Firebase Hosting)**
- ✅ Gratis para proyectos personales
- ✅ SSL automático incluido
- ✅ CDN global de Google
- ✅ Custom domain gratuito
- ✅ Preview channels (como Vercel previews)
- ✅ Deploy desde la raíz del proyecto
- ✅ Integración perfecta con Functions

**Backend + DB (Firebase)**
- ✅ Firestore como base de datos (1GB gratis, 50K reads/day, 20K writes/day)
- ✅ Authentication integrado (10K auth/mes gratis)
- ✅ Cloud Functions para backend (2M invocations/mes gratis)
- ✅ Storage para screenshots (5GB gratis, 1GB download/day)
- ✅ Todo administrado desde Firebase Console

```bash
# Estructura del proyecto
bookmarks/                         # Repo único
├── frontend/                      # Directorio frontend
│   ├── src/
│   ├── public/
│   ├── package.json              # Dependencias frontend
│   ├── vite.config.ts
│   └── .env.example
│
├── functions/                     # Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── bookmarks/
│   │   └── screenshots/
│   ├── package.json              # Dependencias functions
│   └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── deploy-firebase.yml   # Deploy automático con GitHub Actions
│
├── firebase.json                 # Config Firebase (hosting + functions + rules)
├── firestore.rules
├── storage.rules
├── .firebaserc
├── .gitignore
└── README.md
```

**Ventajas de Firebase Hosting:**
- ✅ Un solo proveedor - más simple de administrar
- ✅ Un solo `firebase deploy` para todo
- ✅ Tipos compartidos entre frontend/functions
- ✅ Versionado sincronizado
- ✅ Integración perfecta entre hosting y functions
- ✅ Preview channels incluidos (como Vercel)
- ✅ Sin necesidad de configurar CORS

**Costos**: $0/mes para uso personal (dentro de los límites gratuitos)

**Límites del plan gratuito suficientes para uso personal:**
- Firestore: 1GB almacenamiento, 50K lecturas/día, 20K escrituras/día
- Cloud Functions: 2M invocaciones/mes, 400K GB-s/mes
- Storage: 5GB almacenamiento, 1GB descarga/día
- Hosting: 10GB ancho de banda/mes

---

## ⚙️ Configuración de Deploy con Firebase

### 🔥 Firebase - Todo desde la Raíz

Firebase maneja todo desde un solo comando. El archivo `firebase.json` ya está configurado.

**Deploy completo (hosting + functions + rules):**

```bash
firebase deploy
```

**Deploy selectivo:**

```bash
# Solo frontend
firebase deploy --only hosting

# Solo functions
firebase deploy --only functions

# Solo rules
firebase deploy --only firestore:rules,storage:rules

# Función específica
firebase deploy --only functions:createBookmark
```

**Preview channels (como Vercel previews):**

```bash
# Crear preview de una rama
firebase hosting:channel:deploy feature-branch

# Ver todos los preview channels
firebase hosting:channel:list

# Eliminar un preview channel
firebase hosting:channel:delete feature-branch
```

---

### 🤖 GitHub Actions - Deploy Automático

El workflow despliega todo con un solo job:

```yaml
# .github/workflows/deploy-firebase.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

**Configuración de secrets:**

```bash
# 1. Obtener token de Firebase
firebase login:ci

# 2. Agregar como secret en GitHub
# GitHub → Settings → Secrets → FIREBASE_TOKEN
```

**Cómo funciona:**
1. GitHub Actions clona el repo
2. Firebase CLI ejecuta los predeploy hooks automáticamente:
   - Instala dependencias del frontend
   - Build del frontend
   - Instala dependencias de functions
   - Build de functions
3. Despliega todo junto

---



---

## 🛠️ Desarrollo con Claude Code

### Skills Necesarios para Claude Code

```bash
# Skills que deberías tener habilitados
- frontend-design      # Para componentes React con buen diseño
- docx                # Si necesitas documentación
- product-self-knowledge  # Info sobre características de Claude
```

### Commands Clave para el Proyecto

```bash
# 1. Inicializar proyecto
"Crea un proyecto full-stack con React + TypeScript en frontend y Express + TypeScript en backend usando Vite"

# 2. Setup de base de datos
"Configura Prisma con PostgreSQL y crea el esquema para User, Bookmark y Tag según las especificaciones"

# 3. Autenticación
"Implementa un sistema de autenticación completo con JWT, incluyendo registro, login, logout y recuperación de contraseña"

# 4. CRUD de Bookmarks
"Crea los endpoints REST para CRUD de bookmarks con paginación cursor-based y filtros por tags, búsqueda y fechas"

# 5. Frontend
"Crea el componente de Card para bookmarks con screenshot, título, fecha, descripción y tags usando Tailwind CSS"

# 6. Infinite Scroll
"Implementa scroll infinito con Intersection Observer y React Query para cargar bookmarks paginados"

# 7. Sistema de búsqueda
"Crea un componente de búsqueda avanzada con filtros por texto, tags (multi-select estilo Chosen) y rango de fechas"

# 8. Integración de screenshots
"Integra ApiFlash para capturar screenshots automáticamente cuando se crea un nuevo bookmark"

# 9. Deploy
"Configura el proyecto para deploy en Render.com con PostgreSQL y variables de entorno"
```

### Agents Recomendados

```bash
# Agent 1: Arquitectura
"Actúa como arquitecto de software. Diseña la estructura de carpetas, 
patrones de diseño y flujo de datos para una aplicación de bookmarks"

# Agent 2: Backend Developer
"Actúa como desarrollador backend senior especializado en Node.js y Express. 
Implementa una API RESTful segura con validación, manejo de errores y 
autenticación JWT"

# Agent 3: Frontend Developer
"Actúa como desarrollador frontend experto en React y TypeScript. 
Crea componentes reutilizables, implementa state management con React Query 
y diseña una UI/UX moderna y responsive"

# Agent 4: DevOps
"Actúa como ingeniero DevOps. Configura Docker, CI/CD con GitHub Actions 
y deployment en Render.com/Railway"

# Agent 5: Database Expert
"Actúa como DBA. Optimiza las queries de Prisma, crea índices apropiados 
y diseña migraciones seguras"
```

---

## 📁 Estructura de Carpetas (Firebase)

```
bookmarks/                              # Repositorio git@github.com:cristoj/bookmarks.git
├── frontend/                           # App React (Deploy en Firebase Hosting)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── bookmarks/
│   │   │   │   ├── BookmarkCard.tsx
│   │   │   │   ├── BookmarkGrid.tsx
│   │   │   │   ├── BookmarkForm.tsx
│   │   │   │   └── BookmarkFilters.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── Layout.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useBookmarks.ts
│   │   │   └── useInfiniteScroll.ts
│   │   ├── services/
│   │   │   ├── firebase.ts            # Configuración Firebase
│   │   │   ├── auth.service.ts
│   │   │   └── bookmarks.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── functions/                          # Cloud Functions
│   ├── src/
│   │   ├── index.ts                    # Punto de entrada
│   │   ├── bookmarks/
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── tags.ts
│   │   ├── screenshots/
│   │   │   ├── capture.ts
│   │   │   └── retry.ts
│   │   └── utils/
│   │       ├── auth.ts
│   │       └── validation.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.js
│
├── .github/
│   └── workflows/
│       └── deploy-firebase.yml         # CI/CD para Firebase
│
├── firebase.json                       # Configuración Firebase (hosting + functions + rules)
├── firestore.rules                     # Reglas Firestore
├── firestore.indexes.json              # Índices Firestore
├── storage.rules                       # Reglas Storage
├── .firebaserc                         # Proyectos Firebase
├── .gitignore
├── .env.example
└── README.md
```

---

## 🔧 Variables de Entorno

### Frontend (.env)

```bash
# frontend/.env.example

# Firebase Config (Frontend)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# App Config
VITE_APP_NAME=Bookmarks App
VITE_APP_URL=https://your-project.web.app
```

**Nota:** Estas variables NO son secretas. Firebase espera que estén en el código cliente. La seguridad viene de Firestore/Storage rules, no de ocultar estas claves.

### Cloud Functions

```bash
# Las Cloud Functions usan Firebase Admin SDK automáticamente
# No necesitan variables de entorno para acceder a Firebase

# Opcional: Si usas servicios externos
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-password"

# Acceder en el código
const smtpConfig = functions.config().smtp;
```

---

## 📋 Checklist de Desarrollo

### Fase 1: Setup Inicial
- [ ] Crear repositorio en GitHub: git@github.com:cristoj/bookmarks.git
- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Authentication (Email/Password)
- [ ] Crear base de datos Firestore
- [ ] Habilitar Storage
- [ ] Inicializar proyecto frontend con Vite + React + TypeScript
- [ ] Configurar Firebase SDK en frontend
- [ ] Inicializar Cloud Functions con TypeScript
- [ ] Configurar ESLint, Prettier
- [ ] Crear estructura de carpetas

### Fase 2: Configuración Firebase
- [ ] Configurar firestore.rules
- [ ] Configurar storage.rules
- [ ] Crear índices compuestos en Firestore
- [ ] Configurar variables de entorno
- [ ] Setup inicial de Cloud Functions

### Fase 3: Autenticación (Firebase Auth)
- [ ] Implementar AuthContext en frontend
- [ ] Crear componente LoginForm
- [ ] Crear componente RegisterForm
- [ ] Crear componente ForgotPassword
- [ ] Implementar ProtectedRoute
- [ ] Integrar Firebase Authentication
- [ ] Probar flujo completo de auth

### Fase 4: Cloud Functions Base
- [ ] Cloud Function: createBookmark
- [ ] Cloud Function: getBookmarks (con paginación)
- [ ] Cloud Function: updateBookmark
- [ ] Cloud Function: deleteBookmark
- [ ] Cloud Function: getTags
- [ ] Middleware de autenticación
- [ ] Validación con Zod o similar

### Fase 5: Screenshots con Puppeteer
- [ ] Instalar Puppeteer en Cloud Functions
- [ ] Implementar Cloud Function captureScreenshot
- [ ] Integrar captura al crear bookmark
- [ ] Configurar Storage para screenshots
- [ ] Manejar errores de captura
- [ ] Implementar fallback/retry logic
- [ ] (Opcional) Scheduled function para reintentos

### Fase 6: Frontend - Componentes Base
- [ ] Crear componente BookmarkCard
- [ ] Crear componente BookmarkGrid
- [ ] Crear componente BookmarkForm
- [ ] Implementar skeleton loaders
- [ ] Configurar React Query

### Fase 7: Búsqueda y Filtros
- [ ] Componente de búsqueda por texto
- [ ] Filtro por tags (multi-select)
- [ ] Filtro por rango de fechas
- [ ] Implementar debounce en búsqueda
- [ ] Integrar filtros con Cloud Functions

### Fase 8: Scroll Infinito
- [ ] Implementar paginación cursor-based
- [ ] Configurar React Query infinite queries
- [ ] Implementar Intersection Observer
- [ ] Manejar estados loading/error
- [ ] Optimizar performance

### Fase 9: UI/UX Polish
- [ ] Hacer diseño responsive (mobile/tablet/desktop)
- [ ] Añadir animaciones de transición
- [ ] Mejorar feedback visual (toasts, modales)
- [ ] Implementar estados de carga
- [ ] Mejorar accesibilidad (a11y)
- [ ] Tema claro (oscuro opcional)

### Fase 10: Deploy Setup
- [ ] Habilitar Firebase Hosting en Firebase Console
- [ ] Configurar variables de entorno en frontend/.env
- [ ] Primer deploy manual: `firebase deploy`
- [ ] Obtener token para GitHub Actions: `firebase login:ci`
- [ ] Crear workflow de GitHub Actions
- [ ] Configurar secret FIREBASE_TOKEN en GitHub

### Fase 11: GitHub Actions
- [ ] Crear .github/workflows/deploy-firebase.yml
- [ ] Configurar secret FIREBASE_TOKEN en GitHub
- [ ] Probar deploy automático con push a main
- [ ] Verificar que funcione hosting + functions

### Fase 12: Testing Final
- [ ] Probar registro de usuario
- [ ] Probar login/logout
- [ ] Probar crear bookmark con screenshot
- [ ] Probar editar bookmark
- [ ] Probar eliminar bookmark
- [ ] Probar búsqueda y filtros
- [ ] Probar scroll infinito
- [ ] Probar en mobile
- [ ] Performance testing

### Fase 13: Documentación
- [ ] README.md con instrucciones de setup
- [ ] Documentar variables de entorno
- [ ] Documentar proceso de deploy
- [ ] Documentar comandos útiles
- [ ] Crear .env.example

### Fase 14: Producción
- [ ] Crear tag v1.0.0
- [ ] Deploy automático vía GitHub Actions
- [ ] Verificar que todo funcione en producción
- [ ] Monitorear logs de Firebase Functions
- [ ] Verificar costos en Firebase Console

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- React: https://react.dev
- Vite: https://vitejs.dev
- Prisma: https://www.prisma.io/docs
- React Query: https://tanstack.com/query/latest
- Tailwind CSS: https://tailwindcss.com

### Tutoriales Recomendados
- Full Stack App con React + Express: https://www.youtube.com/watch?v=98BzS5Oz5E4
- Prisma Crash Course: https://www.youtube.com/watch?v=RebA5J-rlwg
- React Query Tutorial: https://www.youtube.com/watch?v=novnyCaa7To
- Deploy en Render: https://render.com/docs

### APIs de Screenshots
- ApiFlash: https://apiflash.com/documentation
- ScreenshotOne: https://screenshotone.com/docs
- Puppeteer: https://pptr.dev

---

---

## 🚀 CI/CD con GitHub Actions

### Workflow para Deploy en Vercel

Crear archivo: `.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    tags:
      - 'v*.*.*'  # Trigger en tags como v1.0.0, v1.2.3, etc.

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            Frontend deployed to Vercel
            Tag: ${{ github.ref }}
          draft: false
          prerelease: false
```

### Workflow para Deploy en Firebase

Crear archivo: `.github/workflows/deploy-firebase.yml`

```yaml
name: Deploy Functions to Firebase

on:
  push:
    tags:
      - 'v*.*.*'  # Trigger en tags como v1.0.0, v1.2.3, etc.

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json
      
      - name: Install Functions dependencies
        working-directory: ./functions
        run: npm ci
      
      - name: Build Functions
        working-directory: ./functions
        run: npm run build
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions,firestore:rules,storage:rules
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      - name: Notify deployment
        run: |
          echo "Firebase Functions deployed successfully!"
          echo "Tag: ${{ github.ref }}"
```

### Workflow Combinado (Recomendado)

Crear archivo: `.github/workflows/deploy-all.yml`

```yaml
name: Deploy All (Vercel + Firebase)

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install Frontend dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build Frontend
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.VITE_FIREBASE_MEASUREMENT_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'

  deploy-backend:
    name: Deploy Functions to Firebase
    runs-on: ubuntu-latest
    needs: deploy-frontend  # Espera a que frontend termine
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json
      
      - name: Install Functions dependencies
        working-directory: ./functions
        run: npm ci
      
      - name: Build Functions
        working-directory: ./functions
        run: npm run build
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions,firestore:rules,storage:rules
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  
  create-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref_name }}
          body: |
            🚀 Deployment completed successfully!
            
            - ✅ Frontend deployed to Vercel
            - ✅ Backend deployed to Firebase
            - 📦 Version: ${{ github.ref_name }}
            
            Changes in this release:
            - See commit history for details
          draft: false
          prerelease: false
```

**Puntos clave del workflow:**

1. **`working-directory`**: Cada step especifica en qué subdirectorio trabajar
2. **`cache-dependency-path`**: Apunta al package-lock.json correcto
3. **Frontend deploy**: Vercel action usa `working-directory: ./frontend`
4. **Firebase deploy**: Se ejecuta desde root (comportamiento por defecto)
5. **Secrets separados**: Frontend y Firebase tienen sus propias variables

---

### Configurar Secrets en GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions

**Para Vercel:**
1. `VERCEL_TOKEN`: Token de Vercel (obtener en https://vercel.com/account/tokens)
2. `VERCEL_ORG_ID`: ID de tu organización (en .vercel/project.json después del primer deploy)
3. `VERCEL_PROJECT_ID`: ID del proyecto (en .vercel/project.json)

**Para Firebase:**
1. `FIREBASE_TOKEN`: Token de Firebase CLI
   ```bash
   firebase login:ci
   # Copia el token generado
   ```
2. `FIREBASE_PROJECT_ID`: ID de tu proyecto Firebase

**Para Firebase Config (Frontend):**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Crear un Tag de Versión

```bash
# Asegurarte de estar en main/master
git checkout main
git pull origin main

# Crear tag localmente
git tag -a v1.0.0 -m "Release v1.0.0 - Initial release"

# Pushear el tag
git push origin v1.0.0

# Esto triggereará automáticamente el deploy en GitHub Actions
```

### Comandos Útiles para Tags

```bash
# Ver todos los tags
git tag

# Ver tags con mensajes
git tag -n

# Eliminar tag local
git tag -d v1.0.0

# Eliminar tag remoto
git push origin :refs/tags/v1.0.0

# Crear tag desde un commit específico
git tag -a v1.0.0 <commit-hash> -m "Message"

# Ver información de un tag
git show v1.0.0
```

### Versionado Semántico Recomendado

Sigue el estándar [Semantic Versioning](https://semver.org/):

- **MAJOR** (v1.0.0 → v2.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (v1.0.0 → v1.1.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (v1.0.0 → v1.0.1): Bug fixes compatibles con versiones anteriores

Ejemplos:
```bash
git tag -a v1.0.0 -m "Initial release"
git tag -a v1.1.0 -m "Add tags filter feature"
git tag -a v1.1.1 -m "Fix screenshot bug"
git tag -a v2.0.0 -m "Migrate to new API structure"
```

---

## 🚨 Consideraciones de Seguridad

### Checklist de Seguridad para Firebase

- [ ] Configurar reglas de seguridad en Firestore (firestore.rules)
- [ ] Configurar reglas de seguridad en Storage (storage.rules)
- [ ] Habilitar autenticación de email con verificación
- [ ] Validar todos los inputs en Cloud Functions
- [ ] Implementar rate limiting en Cloud Functions
- [ ] No exponer claves API sensibles en el frontend (Firebase keys son públicas y seguras)
- [ ] Usar HTTPS en producción (Vercel lo hace automáticamente)
- [ ] Configurar CORS apropiadamente en Cloud Functions
- [ ] Implementar CSP (Content Security Policy) en headers
- [ ] Rotar Firebase tokens regularmente
- [ ] Hacer backups de Firestore (usar Cloud Scheduler)
- [ ] Implementar logging de eventos importantes
- [ ] Mantener dependencias actualizadas (npm audit)
- [ ] Habilitar 2FA en Firebase Console
- [ ] Limitar dominios autorizados en Firebase Auth

---



## 💡 Ideas de Mejoras Futuras

1. **Importar bookmarks desde navegador** (Chrome/Firefox)
2. **Extensión de navegador** para guardar rápido
3. **Compartir colecciones** públicamente
4. **Modo offline** con Service Workers
5. **Búsqueda full-text** con PostgreSQL o Elasticsearch
6. **Sugerencias de tags** con IA
7. **Backup automático** a Google Drive
8. **Estadísticas** de uso y sitios más guardados
9. **Modo lectura** para artículos
10. **Integración con Pocket/Instapaper**

---

## 📞 Comandos Útiles para Claude Code

### Durante el Desarrollo

```bash
# Crear nueva feature
"Crea una nueva feature para [descripción] siguiendo la estructura existente del proyecto"

# Debugging
"Encuentra y explica el bug en [archivo/función] que está causando [problema]"

# Refactoring
"Refactoriza [componente/función] para mejorar [performance/legibilidad/mantenibilidad]"

# Testing
"Crea tests unitarios para [función/componente] cubriendo casos edge"

# Documentación
"Documenta el componente [nombre] con JSDoc y ejemplos de uso"

# Performance
"Analiza el performance de [componente] y sugiere optimizaciones"

# Security
"Revisa [código] buscando vulnerabilidades de seguridad y sugiere fixes"
```

---

## 🎯 Resumen Ejecutivo

### Repositorio
```bash
git@github.com:cristoj/bookmarks.git
```

### Stack Final
- **Frontend**: React + TypeScript + Vite + Tailwind CSS → Firebase Hosting
- **Backend**: Firebase Cloud Functions + TypeScript
- **Database**: Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (screenshots)
- **Screenshots**: Puppeteer en Cloud Functions
- **CI/CD**: GitHub Actions (deploy automático)

### Arquitectura
```
┌─────────────────────────────────────┐
│         Firebase (Todo en Uno)      │
│  ┌──────────┐  ┌──────────────┐   │
│  │ Hosting  │  │     Auth     │   │
│  │ (React)  │  └──────────────┘   │
│  └──────────┘  ┌──────────────┐   │
│  ┌──────────┐  │  Firestore   │   │
│  │ Storage  │  └──────────────┘   │
│  └──────────┘  ┌──────────────┐   │
│                 │   Functions  │   │
│                 │  (Puppeteer) │   │
│                 └──────────────┘   │
└─────────────────────────────────────┘
```

### Flujo de Desarrollo

1. **Desarrollo local**
   ```bash
   # Frontend
   cd frontend && npm run dev

   # Emuladores (todo junto)
   firebase emulators:start
   ```

2. **Deploy manual**
   ```bash
   firebase deploy
   ```

3. **Deploy automático (GitHub Actions)**
   - Push a main
   - GitHub Actions ejecuta firebase deploy
   - Despliega hosting + functions + rules

### Tiempo Estimado de Desarrollo
- Setup inicial + Firebase: 3-4 horas
- Autenticación: 2-3 horas
- Cloud Functions + CRUD: 5-6 horas
- Frontend completo: 8-10 horas
- Screenshots con Puppeteer: 3-4 horas
- GitHub Actions + Deploy: 2-3 horas

**Total: 25-30 horas** (distribuido en 1-2 semanas)

### Costo Mensual Estimado

**Plan Gratuito (Suficiente para uso personal):**
- Firebase Hosting: $0 (10GB transfer/mes)
- Firebase Auth: $0 (10K auth/mes)
- Firestore: $0 (1GB, 50K reads/day, 20K writes/day)
- Cloud Functions: $0 (2M invocations/mes, 400K GB-s)
- Storage: $0 (5GB almacenamiento, 1GB download/day)
- **Límite de screenshots**: ~1000/mes en plan gratuito

**Si excedes límites (poco probable para uso personal):**
- Firebase Blaze (Pay-as-you-go): ~$5-10/mes
- Todo sigue bajo un solo proveedor

---

## 📝 Próximos Pasos

1. **Crear repositorio en GitHub**
   ```bash
   # Si aún no existe
   git init
   git remote add origin git@github.com:cristoj/bookmarks.git
   ```

2. **Crear proyecto en Firebase**
   - Ir a https://console.firebase.google.com
   - Crear nuevo proyecto
   - Habilitar Authentication (Email/Password)
   - Crear base de datos Firestore
   - Habilitar Storage
   - Habilitar Hosting
   - Copiar configuración del SDK

3. **Abrir Claude Code** y comenzar con:
   ```bash
   "Crea un proyecto full-stack para un agregador de bookmarks 
   según las especificaciones. Estructura:
   - /frontend: React + TypeScript + Vite + Tailwind + Firebase SDK
   - /functions: Firebase Cloud Functions con TypeScript
   
   Incluye:
   - Firebase config y setup
   - Estructura de carpetas completa
   - Configuración de Firestore rules y Storage rules
   - AuthContext con Firebase Auth
   - Setup básico de Cloud Functions"
   ```

4. **Desarrollo iterativo** feature por feature siguiendo el checklist

5. **Primer deploy manual**
   ```bash
   firebase deploy
   ```

6. **Configurar GitHub Actions**
   - Obtener token: `firebase login:ci`
   - Configurar secret FIREBASE_TOKEN en GitHub
   - Crear workflow de deploy automático

7. **Iterar y mejorar** según uso

---

**¿Tienes alguna pregunta específica sobre alguna sección? Estoy aquí para ayudarte con más detalles técnicos o aclaraciones.**
