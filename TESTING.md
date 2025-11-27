# Testing Guide

Este documento describe cómo ejecutar los tests del proyecto.

## Frontend Tests

Los tests del frontend **NO** requieren emuladores. Usan mocks para todas las dependencias de Firebase.

### Ejecutar todos los tests

```bash
cd frontend
npm test
```

### Ejecutar tests en modo watch

```bash
cd frontend
npm run test:watch
```

### Ejecutar tests con cobertura

```bash
cd frontend
npm run test:coverage
```

### Ejecutar tests con UI

```bash
cd frontend
npm run test:ui
```

## Backend (Functions) Tests

Los tests del backend **REQUIEREN** que los emuladores de Firebase estén corriendo.

### Prerequisitos

Asegúrate de tener Firebase CLI instalado:

```bash
npm install -g firebase-tools
```

### Opción 1: Ejecutar emuladores y tests en terminales separadas

**Terminal 1** - Iniciar emuladores:
```bash
# Desde la raíz del proyecto
firebase emulators:start
```

**Terminal 2** - Ejecutar tests:
```bash
cd functions
npm test
```

### Opción 2: Ejecutar tests sin verificar emuladores

Si ya sabes que los emuladores están corriendo:

```bash
cd functions
npm run test:no-check
```

### Verificar estado de emuladores

Puedes verificar si los emulators están corriendo:

```bash
cd functions
node check-emulators.js
```

Este script verifica:
- ✓ Firestore Emulator (puerto 8080)
- ✓ Auth Emulator (puerto 9099)
- ✓ Storage Emulator (puerto 9199)

### Debugging de tests

Si los tests fallan, verifica:

1. **Emuladores corriendo**: Ejecuta `node check-emulators.js`
2. **Puertos disponibles**: Asegúrate de que los puertos 8080, 9099, 9199 no estén en uso
3. **Firebase inicializado**: Los emuladores deben estar corriendo ANTES de ejecutar los tests

### Tests específicos

Para ejecutar tests de un archivo específico:

```bash
cd functions
npm test -- --grep "createBookmark"
```

### Timeout de tests

Los tests tienen un timeout de 10 segundos. Si algún test tarda más:

1. Verifica que los emuladores estén corriendo
2. Verifica la conexión a los emuladores
3. Aumenta el timeout si es necesario (en el archivo de test o en package.json)

## Estructura de Tests

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   └── *.test.tsx        # Tests de componentes
│   ├── hooks/
│   │   └── *.test.ts          # Tests de hooks
│   ├── services/
│   │   └── *.test.ts          # Tests de servicios
│   └── test/
│       ├── setup.ts           # Configuración global
│       └── test-utils.tsx     # Utilidades de test (wrappers)
```

### Backend
```
functions/
├── src/
│   ├── bookmarks/
│   │   └── *.test.ts          # Tests de funciones de bookmarks
│   ├── screenshots/
│   │   └── *.test.ts          # Tests de funciones de screenshots
│   ├── test-helpers.ts        # Helpers y configuración
│   └── check-emulators.js     # Script de verificación
```

## Troubleshooting

### Frontend

**Problema**: Tests fallan con "No QueryClient set"
**Solución**: Usa `renderWithQuery` o `renderWithProviders` de `test-utils.tsx`

**Problema**: Tests fallan con "useNavigate() may be used only in the context of a <Router>"
**Solución**: Usa `renderWithProviders` que incluye BrowserRouter

### Backend

**Problema**: "The default Firebase app does not exist"
**Solución**: Asegúrate de que `test-helpers.ts` se está importando en todos los archivos de test

**Problema**: "Timeout of 10000ms exceeded"
**Solución**:
1. Verifica que los emuladores estén corriendo con `node check-emulators.js`
2. Asegúrate de que las variables de entorno estén configuradas correctamente en `test-helpers.ts`

**Problema**: Tests pasan pero con warnings sobre "MODULE_TYPELESS_PACKAGE_JSON"
**Solución**: Esto es solo un warning. Puedes ignorarlo o agregar `"type": "module"` a `package.json` (aunque esto puede requerir otros cambios en el proyecto)

## CI/CD

Para ejecutar tests en CI/CD:

### Frontend
```bash
cd frontend && npm run test:run
```

### Backend
```bash
# Iniciar emuladores en background
firebase emulators:start &
EMULATOR_PID=$!

# Esperar a que los emuladores estén listos
sleep 10

# Ejecutar tests
cd functions && npm test

# Detener emuladores
kill $EMULATOR_PID
```

O usar el comando de Firebase que combina ambos:
```bash
firebase emulators:exec "cd functions && npm test"
```
