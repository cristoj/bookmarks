# Scripts de Mantenimiento de Bookmarks

Este directorio contiene scripts de utilidad para el mantenimiento de la aplicación de bookmarks.

## Requisitos Previos

1. **Autenticación con Firebase CLI:**
   ```bash
   firebase login
   ```

2. **Dependencias instaladas:**
   ```bash
   npm install
   ```

## Scripts Disponibles

### 1. Migrar URLs de Screenshots (`migrate-screenshot-urls`)

**Propósito:** Convierte las URLs firmadas (con expiración) a URLs públicas permanentes.

**Cuándo usar:**
- Después de actualizar las Cloud Functions que generan URLs públicas
- Cuando las screenshots antiguas muestran error "SignatureDoesNotMatch"
- Para asegurar que todas las screenshots usen URLs que no caducan

**Uso:**
```bash
npm run migrate-screenshot-urls
```

**Qué hace:**
1. Busca todos los bookmarks con `screenshotStatus: 'completed'`
2. Identifica cuáles tienen signed URLs (con `token=` o `Expires=`)
3. Regenera URLs públicas desde el `screenshotPath`
4. Actualiza Firestore en batches de 500 documentos

**IMPORTANTE:** Las Storage Rules deben permitir lectura pública (`allow read: if true`) para que las URLs públicas funcionen. Esto ya está configurado en `storage.rules`.

---

### 2. Importar Bookmarks (`import-bookmarks`)

**Propósito:** Importa bookmarks desde un archivo JSON a Firebase.

**Uso:**

Probar con 1 bookmark (recomendado para depuración):
```bash
npm run import-bookmarks -- --limit=1
```

Importar 10 bookmarks:
```bash
npm run import-bookmarks -- --limit=10
```

Importar TODOS los bookmarks (2537 total):
```bash
npm run import-bookmarks
```

---

### 3. Limpiar Bookmarks (`cleanup-bookmarks`)

**Propósito:** Elimina todos los bookmarks de un usuario (útil para testing).

**⚠️ CUIDADO:** Este script es destructivo y elimina TODOS los bookmarks del usuario especificado.

**Uso:**
```bash
npm run cleanup-bookmarks
```

## Qué hace el script

1. Lee el archivo `/docs/bookmarks_marcador.json`
2. Para cada bookmark:
   - Busca la imagen correspondiente en `/docs/screenshot/`
   - Sube la imagen a Firebase Storage (`screenshots/{userId}/{uuid}.jpg`)
   - Crea el documento en Firestore con:
     - userId: `NIAi6T69C7Sbc63G9og7i4XuHC62`
     - Campos mapeados desde el JSON
     - `screenshotStatus: 'completed'` (para evitar trigger de captura automática)
     - Tags convertidos de string separado por comas a array
   - Actualiza los contadores de tags en la colección `tags`

3. Genera un log detallado en `/scripts/import-log.json`

## Log de Importación

El script genera un archivo `import-log.json` con:
- Timestamp de la importación
- Total de bookmarks procesados
- Número de exitosos y fallidos
- Detalle de cada bookmark:
  - URL
  - Título
  - Estado (success/error)
  - Si la screenshot se subió correctamente

## Notas Importantes

- **Imágenes faltantes**: Si una imagen no existe, el bookmark se crea con `screenshotUrl: null` y `screenshotPath: null`
- **Descripción vacía**: Si la descripción está vacía, se reemplaza con "-"
- **No dispara captura automática**: Los bookmarks se crean con `screenshotStatus: 'completed'`, por lo que el trigger `onBookmarkCreated` no intentará capturar screenshots

## Estimación de Tiempo

- **1 bookmark**: ~2-3 segundos
- **100 bookmarks**: ~3-5 minutos
- **2537 bookmarks completos**: ~1-2 horas (dependiendo de la velocidad de red)

## Troubleshooting

### Error: "Permission denied"
- Verifica que estás autenticado: `firebase login`
- Verifica que tienes permisos en el proyecto Firebase

### Error: "Project not found"
- Verifica que el projectId en el script es correcto
- Verifica que estás en el proyecto correcto: `firebase use bookmarks-cristoj`

### Error: "Module not found"
- Ejecuta `npm install` en la raíz del proyecto
