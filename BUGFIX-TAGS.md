# 🐛 Bug Fix: Tags con espacios causan error 500

## Problema Identificado

Al crear un bookmark con tags que contienen espacios (como "image recognition"), la función `createBookmark` fallaba con error 500 INTERNAL.

### Causa Raíz

En `functions/src/bookmarks/helpers.ts`, la función `updateTagCounts` usaba los tags directamente como document IDs en Firestore:

```typescript
const tagRef = db.collection("tags").doc(tag.toLowerCase());
```

**Problema:** Los document IDs en Firestore tienen restricciones con espacios y caracteres especiales, lo que causaba errores al intentar crear/actualizar estos documentos.

## Solución Aplicada

He agregado una función `normalizeTagForId` que:
1. Convierte el tag a minúsculas
2. Reemplaza espacios con guiones
3. Elimina caracteres especiales

```typescript
function normalizeTagForId(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Espacios → guiones
    .replace(/[^a-z0-9-]/g, ""); // Solo alfanuméricos y guiones
}
```

### Ejemplos de normalización:
- `"image recognition"` → `"image-recognition"`
- `"SaaS Platform"` → `"saas-platform"`
- `"React.js"` → `"reactjs"`

## Mejoras Adicionales

1. **Uso de `batch.set()` con `merge` en lugar de `batch.update()`** para tags removidos
   - Esto evita errores si el documento de tag no existe

2. **Validación mejorada**
   - Se ignoran tags vacíos o con solo espacios
   - Solo se hace commit si hay operaciones pendientes

## Archivo Modificado

- `functions/src/bookmarks/helpers.ts` - Función `updateTagCounts()`

## Cómo Aplicar el Fix

1. **Ya compilado:** El código ya está compilado (`npm run build` exitoso)

2. **Reiniciar emuladores:**
   ```bash
   # Detener emuladores actuales (Ctrl+C en la terminal donde corren)

   # Iniciar emuladores nuevamente
   firebase emulators:start
   ```

3. **Verificar el fix:**
   ```bash
   # Probar con el payload original que fallaba:
   POST http://localhost:5001/bookmarks-cristoj/us-central1/createBookmark
   {
     "data": {
       "url": "https://www.stik.world/",
       "title": "STIK",
       "description": "Post on your favorite objects",
       "tags": ["saas", "image recognition"]
     }
   }
   ```

## Estructura de Tags en Firestore

### Antes (❌ Causaba errores):
```
tags/
  ├── saas/           (✓ funcionaba)
  └── image recognition/  (✗ ERROR - espacios no permitidos)
```

### Después (✅ Funciona correctamente):
```
tags/
  ├── saas/
  │   └── name: "saas"
  │   └── count: 5
  └── image-recognition/
      └── name: "image recognition"  (nombre original preservado)
      └── count: 3
```

**Importante:** El nombre original del tag se guarda en el campo `name`, por lo que se muestra correctamente en el frontend.

## Tests Actualizados

Los tests existentes seguirán funcionando porque:
- Tags sin espacios (como "saas", "javascript") se normalizan a lo mismo
- La lógica de negocio no cambia, solo el formato del document ID

## Cambios Necesarios en Frontend

**No se requieren cambios en el frontend** porque:
- El campo `name` del tag contiene el texto original
- La función `getTags` retorna `data.name`, no el document ID
- Los usuarios siguen viendo "image recognition", no "image-recognition"

## Notas Técnicas

### Por qué usar guiones y no otros caracteres:
- Los guiones son seguros en document IDs de Firestore
- Son URL-friendly si se necesita usar en rutas
- Son legibles y mantienen algo de la estructura original

### Por qué preservar el nombre original:
- Los usuarios ven el tag tal como lo escribieron
- Permite diferentes formas de escribir el mismo tag conceptual
- Ejemplo: "React.js" y "reactjs" se normalizan al mismo ID pero mantienen sus nombres

## Verificación Post-Deploy

Después de reiniciar emuladores, verificar:

1. ✅ Crear bookmark con tags con espacios
2. ✅ Crear múltiples bookmarks con el mismo tag (diferentes formas)
3. ✅ Ver que los counts se incrementan correctamente
4. ✅ La función `getTags` retorna los tags con nombres originales
5. ✅ Actualizar y eliminar bookmarks actualiza counts correctamente

## Rollback (si es necesario)

Si por alguna razón necesitas revertir:
```bash
cd functions
git checkout HEAD -- src/bookmarks/helpers.ts
npm run build
# Reiniciar emuladores
```
