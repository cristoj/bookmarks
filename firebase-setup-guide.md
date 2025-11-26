# Guía de Setup de Firebase para Bookmarks App

## 🔥 Configuración Inicial de Firebase

### 1. Crear Proyecto en Firebase Console

1. Ir a https://console.firebase.google.com
2. Clic en "Añadir proyecto"
3. Nombre: `bookmarks-app` (o el que prefieras)
4. Habilitar Google Analytics (opcional)
5. Crear proyecto

### 2. Configurar Authentication

1. En el menú lateral → Authentication
2. Clic en "Comenzar"
3. En la pestaña "Sign-in method"
4. Habilitar "Correo electrónico/contraseña"
5. (Opcional) Habilitar "Verificación de correo electrónico"

### 3. Configurar Firestore Database

1. En el menú lateral → Firestore Database
2. Clic en "Crear base de datos"
3. Modo: Empezar en **modo de producción**
4. Ubicación: Elegir la más cercana (eur3 para Europa)
5. Clic en "Habilitar"

### 4. Configurar Storage

1. En el menú lateral → Storage
2. Clic en "Comenzar"
3. Modo: Empezar en **modo de producción**
4. Ubicación: Misma que Firestore
5. Clic en "Listo"

---

## 📄 Archivos de Configuración

### firebase.json

Crear en la raíz del proyecto:

```json
{
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ],
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidBookmark() {
      let data = request.resource.data;
      return data.keys().hasAll(['userId', 'url', 'title', 'tags', 'createdAt', 'updatedAt']) &&
             data.userId is string &&
             data.url is string &&
             data.title is string &&
             data.tags is list &&
             data.createdAt is timestamp &&
             data.updatedAt is timestamp;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // Bookmarks collection
    match /bookmarks/{bookmarkId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && 
                       isOwner(request.resource.data.userId) &&
                       isValidBookmark();
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Tags collection - read-only, updated by Cloud Functions
    match /tags/{tagId} {
      allow read: if isAuthenticated();
      allow write: if false; // Solo Cloud Functions
    }
  }
}
```

### firestore.indexes.json

```json
{
  "indexes": [
    {
      "collectionGroup": "bookmarks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "bookmarks",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "tags",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### storage.rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Screenshots storage
    match /screenshots/{userId}/{fileName} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && 
                      isOwner(userId) && 
                      isImage() && 
                      isUnder10MB();
      allow delete: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

### .firebaserc

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## 🔧 Configuración del Frontend

### frontend/src/services/firebase.ts

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Para desarrollo local, conectar a emulators
if (import.meta.env.DEV) {
  // Descomentar para usar emuladores locales
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app;
```

### frontend/.env.example

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# App Configuration
VITE_APP_NAME=Bookmarks App
VITE_APP_URL=http://localhost:5173
```

---

## 🛠️ Configuración de Cloud Functions

### functions/package.json

```json
{
  "name": "bookmarks-functions",
  "version": "1.0.0",
  "description": "Cloud Functions for Bookmarks App",
  "main": "lib/index.js",
  "engines": {
    "node": "18"
  },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
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
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.3.3"
  },
  "private": true
}
```

### functions/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

### functions/src/index.ts

```typescript
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
admin.initializeApp();

// Exportar todas las funciones
export * from './bookmarks/create';
export * from './bookmarks/get';
export * from './bookmarks/update';
export * from './bookmarks/delete';
export * from './bookmarks/tags';
export * from './screenshots/capture';
export * from './screenshots/retry';
```

---

## 🚀 Comandos de Firebase CLI

### Instalación

```bash
npm install -g firebase-tools
```

### Login

```bash
firebase login
```

### Inicializar proyecto

```bash
firebase init

# Seleccionar:
# - Firestore
# - Functions
# - Storage
# - Emulators

# Lenguaje: TypeScript
# ESLint: Yes
# Install dependencies: Yes
```

### Desarrollo local con Emulators

```bash
# Iniciar emuladores
firebase emulators:start

# Solo functions
firebase emulators:start --only functions

# Con debug
firebase emulators:start --inspect-functions
```

### Deploy

```bash
# Deploy todo
firebase deploy

# Solo functions
firebase deploy --only functions

# Solo rules
firebase deploy --only firestore:rules,storage:rules

# Función específica
firebase deploy --only functions:createBookmark
```

### Logs

```bash
# Ver logs en tiempo real
firebase functions:log --only createBookmark

# Ver logs recientes
firebase functions:log --limit 100
```

### Variables de configuración

```bash
# Establecer variable
firebase functions:config:set smtp.host="smtp.gmail.com"

# Ver configuración
firebase functions:config:get

# Eliminar variable
firebase functions:config:unset smtp.host
```

---

## 🔐 Obtener Credenciales

### 1. Configuración del Frontend

En Firebase Console:
1. Ir a Project Settings (⚙️)
2. En "Your apps" → Seleccionar Web App
3. Si no existe, crear una nueva Web App
4. Copiar toda la configuración `firebaseConfig`
5. Añadir a `.env` en frontend con prefijo `VITE_`

### 2. Token para GitHub Actions

```bash
# Generar token CI
firebase login:ci

# Copiar el token generado
# Añadirlo como secret FIREBASE_TOKEN en GitHub
```

### 3. Service Account (opcional, para scripts)

En Firebase Console:
1. Project Settings → Service Accounts
2. Clic en "Generate new private key"
3. Guardar JSON de forma segura
4. **NUNCA** commitear este archivo al repositorio

---

## 📊 Monitoreo y Límites

### Ver uso actual

Firebase Console → Usage and billing

### Límites del Plan Spark (Gratuito)

- **Firestore**:
  - 1 GB almacenamiento
  - 50,000 lecturas/día
  - 20,000 escrituras/día
  - 20,000 eliminaciones/día

- **Cloud Functions**:
  - 2,000,000 invocaciones/mes
  - 400,000 GB-segundos/mes
  - 200,000 CPU-segundos/mes
  - 5 GB salida de red/mes

- **Storage**:
  - 5 GB almacenamiento
  - 1 GB descarga/día
  - 20,000 operaciones get/día
  - 20,000 operaciones upload/día

- **Authentication**:
  - Ilimitado (gratuito)
  - 10K verificaciones de email/día

### Alertas recomendadas

En Firebase Console → Project Settings → Usage and billing:
- Configurar alertas al 80% de uso
- Revisar uso semanal durante primeros meses

---

## 🧪 Testing Local

### 1. Iniciar Emulators

```bash
firebase emulators:start
```

Acceder a:
- UI: http://localhost:4000
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Storage: http://localhost:9199

### 2. Conectar Frontend a Emulators

En `frontend/src/services/firebase.ts`, descomentar:

```typescript
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### 3. Datos de prueba

Los emuladores empiezan limpios cada vez. Para poblar con datos:

```typescript
// scripts/seed-emulator.ts
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

async function seed() {
  await addDoc(collection(db, 'bookmarks'), {
    userId: 'test-user-id',
    url: 'https://example.com',
    title: 'Example',
    description: 'Test bookmark',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log('Seed completed');
}

seed();
```

---

## 🔍 Debugging

### Ver logs de Functions

```bash
# En desarrollo (emulators)
# Los logs aparecen directamente en la terminal

# En producción
firebase functions:log --only createBookmark --limit 50
```

### Inspeccionar datos de Firestore

```bash
# Usar Emulator UI
http://localhost:4000/firestore

# O Firebase Console
https://console.firebase.google.com → Firestore Database
```

### Errores comunes

**Error: Permission denied**
- Verificar firestore.rules
- Verificar que el usuario esté autenticado
- Verificar que el userId coincida

**Error: Function timeout**
- Aumentar timeout en la configuración de la función
- Optimizar código de la función
- Verificar que Puppeteer no se quede colgado

**Error: Insufficient permissions**
- Verificar roles de la Service Account
- Verificar reglas de Storage para screenshots

---

## 📚 Recursos Útiles

- [Documentación Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Puppeteer in Cloud Functions](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-google-cloud-functions)

---

## ✅ Checklist de Setup

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Authentication (Email/Password)
- [ ] Crear Firestore Database
- [ ] Habilitar Storage
- [ ] Copiar configuración del SDK
- [ ] Instalar Firebase CLI: `npm i -g firebase-tools`
- [ ] Login en Firebase: `firebase login`
- [ ] Inicializar proyecto: `firebase init`
- [ ] Crear archivos de configuración (firebase.json, rules, etc.)
- [ ] Configurar variables de entorno en frontend
- [ ] Probar con emulators locales
- [ ] Hacer primer deploy de prueba
- [ ] Configurar GitHub Actions
- [ ] Obtener tokens para CI/CD
- [ ] Configurar alertas de uso

---

**¡Listo! Tu proyecto Firebase está configurado correctamente.**
