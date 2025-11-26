# Comandos para Claude Code - Bookmarks App

Esta guía contiene los comandos exactos para usar con Claude Code en cada fase del desarrollo.

---

## 🎬 Fase 1: Inicialización del Proyecto

### Comando 1: Setup inicial del proyecto

```
Crea la estructura inicial del proyecto "Bookmarks App" con esta organización:

Repositorio: bookmarks/
- frontend/ (React + TypeScript + Vite + Tailwind CSS)
- functions/ (Firebase Cloud Functions con TypeScript)

Para el frontend:
- Usa Vite con template react-ts
- Instala y configura Tailwind CSS
- Instala Firebase SDK: firebase, react-router-dom, react-query
- Crea estructura de carpetas: components/, contexts/, hooks/, services/, pages/, types/, utils/
- Configura path aliases en vite.config.ts
- Crea archivo .env.example con variables VITE_FIREBASE_*

Para las functions:
- Inicializa con TypeScript
- Instala: firebase-admin, firebase-functions, puppeteer, uuid
- Crea estructura: src/bookmarks/, src/screenshots/, src/utils/
- Configura tsconfig.json apropiadamente

Crea también:
- firebase.json en la raíz
- firestore.rules con reglas de seguridad básicas
- storage.rules para screenshots por userId
- .gitignore apropiado
- README.md básico

No instales dependencias aún, solo crea la estructura y archivos de configuración.
```

### Comando 2: Configurar Firebase SDK en Frontend

```
Crea el servicio de Firebase en frontend/src/services/firebase.ts:

- Importa e inicializa Firebase app con firebaseConfig desde variables de entorno
- Exporta instancias de: auth, db (firestore), storage, functions
- Añade configuración para conectar a emuladores en modo desarrollo (comentado por defecto)
- Documenta cada export con comentarios JSDoc

Crea también frontend/src/types/index.ts con interfaces para:
- User (firebase user + datos custom)
- Bookmark (con todos los campos según specs)
- Tag
- BookmarkFilters (para búsqueda)
```

---

## 🔐 Fase 2: Sistema de Autenticación

### Comando 3: Context de Autenticación

```
Implementa el sistema completo de autenticación con Firebase Auth:

1. Crea frontend/src/services/auth.service.ts con funciones para:
   - register(email, password, displayName)
   - login(email, password)
   - logout()
   - forgotPassword(email)
   - onAuthChange(callback)
   - getIdToken()
   Usa Firebase Auth y crea documento de usuario en Firestore al registrar.

2. Crea frontend/src/contexts/AuthContext.tsx:
   - Usa onAuthStateChanged para mantener estado del usuario
   - Provee: user, loading, login, register, logout, forgotPassword
   - Maneja loading state correctamente

3. Crea frontend/src/components/auth/ProtectedRoute.tsx:
   - Redirige a /login si no hay usuario
   - Muestra loading mientras verifica auth

Usa TypeScript correctamente con tipos de Firebase.
```

### Comando 4: Componentes de Autenticación

```
Crea los componentes de UI para autenticación con Tailwind CSS:

1. frontend/src/components/auth/LoginForm.tsx
   - Form con email y password
   - Botón de login y link a "forgot password"
   - Link a página de registro
   - Manejo de errores con estados
   - Validación básica

2. frontend/src/components/auth/RegisterForm.tsx
   - Form con email, password, confirm password, displayName
   - Validación de passwords match
   - Manejo de errores
   - Link a login

3. frontend/src/components/auth/ForgotPassword.tsx
   - Form solo con email
   - Mensaje de éxito tras enviar
   - Link para volver a login

4. frontend/src/pages/Login.tsx y Register.tsx
   - Layout centrado con los forms
   - Diseño responsive y moderno

Usa componentes reutilizables para Input y Button (créalos en components/common/).
Estilos con Tailwind, diseño limpio y profesional.
```

---

## ☁️ Fase 3: Cloud Functions Base

### Comando 5: Estructura base de Functions

```
Crea la estructura base de Cloud Functions en functions/src/:

1. functions/src/index.ts:
   - Inicializa firebase-admin
   - Exporta todas las funciones de otros archivos

2. functions/src/utils/auth.ts:
   - Función helper verifyAuth(context) que verifica autenticación
   - Retorna userId o lanza HttpsError si no autenticado

3. functions/src/utils/validation.ts:
   - Función validateUrl(url) que valida URLs
   - Función validateBookmarkData(data)
   - Usa expresiones regulares apropiadas


No implementes las funciones completas aún, solo la estructura base.
```

### Comando 6: Cloud Functions para Bookmarks - CRUD

```
Implementa las Cloud Functions para CRUD de bookmarks:

1. functions/src/bookmarks/create.ts:
   - Cloud Function: createBookmark
   - Validar datos: url, title requeridos
   - Crear documento en Firestore collection "bookmarks"
   - Actualizar conteo de tags
   - Triggerea captureScreenshot (no implementar aún)
   - Retornar bookmark creado
   - Crear test para validar correcta funcionalidad

2. functions/src/bookmarks/get.ts:
   - Cloud Function: getBookmarks
   - Parámetros: limit (default 20), lastDoc, tags, search, dateFrom, dateTo
   - Implementar paginación cursor-based
   - Filtros por tags (array-contains-any)
   - Filtros por fecha (where createdAt between)
   - Para búsqueda de texto: filtrar en cliente (Firestore no tiene full-text)
   - Retornar: { data: [], lastDoc, hasMore }
   - Crear test para validar correcta funcionalidad

3. functions/src/bookmarks/update.ts:
   - Cloud Function: updateBookmark
   - Verificar ownership
   - Actualizar campos: title, description, tags
   - Actualizar conteo de tags (helper updateTagCounts)
   - Crear test para validar correcta funcionalidad

4. functions/src/bookmarks/delete.ts:
   - Cloud Function: deleteBookmark
   - Verificar ownership
   - Eliminar screenshot de Storage si existe
   - Actualizar conteo de tags
   - Eliminar documento
   - Crear test para validar correcta funcionalidad

5. functions/src/bookmarks/tags.ts:
   - Cloud Function: getTags
   - Retornar todos los tags ordenados por count desc
   - Limit 100
   - Crear test para validar correcta funcionalidad

Usa runWith({ timeoutSeconds: 60, memory: '256MB' }) donde sea necesario.
Documenta cada función con JSDoc.
```

---

## 📸 Fase 4: Sistema de Screenshots

### Comando 7: Cloud Function de Screenshots

```
Implementa el sistema completo de captura de screenshots:

En functions/src/screenshots/capture.ts:

1. Cloud Function: captureScreenshot
   - runWith({ timeoutSeconds: 120, memory: '1GB' })
   - Parámetros: bookmarkId, url
   - Usar Puppeteer para capturar screenshot:
     * Viewport 1280x720
     * headless: true
     * args apropiados para Cloud Functions
     * goto con waitUntil: 'networkidle2', timeout 30s
     * Esperar 2s adicionales
     * Screenshot PNG, fullPage: false
   - Crear test para validar correcta funcionalidad
   
2. Subir a Firebase Storage:
   - Path: screenshots/{userId}/{uuid}.png
   - Metadata: contentType, bookmarkId, capturedAt
   - Generar signed URL con expiración lejana
   - Crear test para validar correcta funcionalidad
   
3. Actualizar Firestore:
   - Campo screenshotUrl con la URL
   - Campo screenshotPath con el path (para borrar después)
   - Crear test para validar correcta funcionalidad
   
4. Manejo de errores:
   - Try-catch completo
   - Si falla, actualizar bookmark con screenshotUrl: null y screenshotError
   - No lanzar error (no bloquear creación de bookmark)
   - Logging detallado
   - Crear test para validar correcta funcionalidad

5. Cerrar browser siempre en finally

Documenta límites del plan gratuito en comentarios.
```

### Comando 8: Retry automático de screenshots

```
Implementa función scheduled para reintentar screenshots fallidos:

En functions/src/screenshots/retry.ts:

Cloud Function: retryFailedScreenshots
- Scheduled: 'every 24 hours'
- Buscar bookmarks con screenshotUrl === null
- Donde screenshotRetries < 3 (añadir campo si no existe)
- Limit 50
- Para cada uno, llamar a captureScreenshot
- Si falla, incrementar screenshotRetries
- Logging apropiado
- Crear test para validar correcta funcionalidad

Esta función es opcional pero útil para recuperar screenshots fallidos.
```

---

## 🎨 Fase 5: Frontend - Servicios de Bookmarks

### Comando 9: Servicio de Bookmarks

```
Crea frontend/src/services/bookmarks.service.ts:

Implementa funciones que llamen a las Cloud Functions usando httpsCallable:

1. create(data: { url, title, description?, tags? })
   - Llama a createBookmark
   - Retorna bookmark creado
   - Crear test para validar correcta funcionalidad

2. getAll(filters: { limit?, lastDoc?, tags?, search?, dateFrom?, dateTo? })
   - Llama a getBookmarks
   - Retorna { data, lastDoc, hasMore }
   - Crear test para validar correcta funcionalidad

3. update(bookmarkId, data: { title?, description?, tags? })
   - Llama a updateBookmark
   - Retorna { success: true }
   - Crear test para validar correcta funcionalidad

4. delete(bookmarkId)
   - Llama a deleteBookmark
   - Retorna { success: true }
   - Crear test para validar correcta funcionalidad

5. getTags()
   - Llama a getTags
   - Retorna array de tags
   - Crear test para validar correcta funcionalidad

Maneja errores apropiadamente y documenta con JSDoc.
```

### Comando 10: Custom Hooks para Bookmarks

```
Crea hooks para gestionar bookmarks con React Query:

1. frontend/src/hooks/useBookmarks.ts:
   - Hook useBookmarks(filters) que usa useInfiniteQuery
   - queryKey con filters
   - queryFn llama a bookmarksService.getAll
   - getNextPageParam retorna lastDoc
   - Retorna: { data, fetchNextPage, hasNextPage, isLoading, error }
   - Crear test para validar correcta funcionalidad

2. frontend/src/hooks/useCreateBookmark.ts:
   - Hook useCreateBookmark() que usa useMutation
   - onSuccess: invalida query 'bookmarks'
   - onError: maneja error
   - Retorna: { create, isLoading, error }
   - Crear test para validar correcta funcionalidad

3. frontend/src/hooks/useUpdateBookmark.ts:
   - Similar estructura con useMutation
   - Invalida query al tener éxito
   - Crear test para validar correcta funcionalidad

4. frontend/src/hooks/useDeleteBookmark.ts:
   - Similar estructura
   - Invalida query al tener éxito
   - Crear test para validar correcta funcionalidad

5. frontend/src/hooks/useTags.ts:
   - Hook useTags() con useQuery
   - Cache de 5 minutos
   - Crear test para validar correcta funcionalidad

Documenta cada hook y sus retornos.
```

---

## 🎯 Fase 6: Componentes de UI - Bookmarks

### Comando 11: Componentes comunes

```
Crea componentes comunes reutilizables en frontend/src/components/common/:

1. Button.tsx:
   - Props: children, onClick, variant ('primary'|'secondary'|'danger'), disabled, loading, type
   - Estilos con Tailwind
   - Mostrar spinner si loading
   - Variantes con colores apropiados

2. Input.tsx:
   - Props: label, type, value, onChange, error, placeholder, required
   - Mostrar error message si existe
   - Estilos consistentes

3. Card.tsx:
   - Props: children, className
   - Card genérico con padding y estilos base

4. Spinner.tsx:
   - Spinner simple con Tailwind
   - Props: size ('sm'|'md'|'lg')

5. Modal.tsx:
   - Props: isOpen, onClose, title, children
   - Overlay con backdrop blur
   - Cerrar con ESC o click fuera
   - Responsive

Usa TypeScript con interfaces para props. Estilos modernos con Tailwind.
```

### Comando 12: BookmarkCard y Grid

```
Crea los componentes principales de visualización de bookmarks:

1. frontend/src/components/bookmarks/BookmarkCard.tsx:
   Props: bookmark, onEdit, onDelete
   
   Estructura del card:
   - Imagen de screenshot (link a url) con fallback si no hay
   - Título (link a url) con truncate si es muy largo
   - Fecha de creación (formato relativo: "hace 2 días")
   - Descripción (truncate después de 2 líneas)
   - Tags (badges, cada tag clickeable para filtrar)
   - Botones de Editar y Eliminar (iconos)
   
   Diseño:
   - Width fijo (320px) o 100% del contenedor
   - Aspect ratio 16:9 para imagen
   - Hover effects sutiles
   - Responsive
   - Diseño limpio y moderno

2. frontend/src/components/bookmarks/BookmarkGrid.tsx:
   Props: bookmarks, onEdit, onDelete, isLoading
   
   - Grid responsive (1/2/3 columnas según breakpoint)
   - Gap consistente
   - Si isLoading: mostrar skeleton loaders (3-6)
   - Si vacío: mensaje "No bookmarks yet"
   - Renderizar BookmarkCard para cada bookmark
   - Crear test para validar correcta funcionalidad

Usa Tailwind CSS, iconos de lucide-react o similar.
```

### Comando 13: Formulario de Bookmark

```
Crea el formulario para crear/editar bookmarks:

frontend/src/components/bookmarks/BookmarkForm.tsx

Props: 
- bookmark (opcional, para editar)
- onSave: (data) => void
- onCancel: () => void
- isLoading: boolean

Form fields:
1. URL (required) - Input text con validación
2. Title (required) - Input text
3. Description (optional) - Textarea
4. Tags (optional) - Input con chips (poder añadir/remover tags)

Funcionalidad:
- Si bookmark existe, pre-llenar form (modo edición)
- Validación básica
- Disable inputs mientras isLoading
- Botones: Save y Cancel
- Mostrar errores de validación
- Crear test para validar correcta funcionalidad

Diseño:
- Form limpio y espaciado
- Labels claros
- Feedback visual de errores
- Responsive

Usa react-hook-form para manejo del form.
```

---

## 🔍 Fase 7: Búsqueda y Filtros

### Comando 14: Componente de Filtros

```
Crea el componente de búsqueda y filtros avanzados:

frontend/src/components/bookmarks/BookmarkFilters.tsx

Props:
- filters: { search, tags, dateFrom, dateTo }
- onFilterChange: (filters) => void
- availableTags: Tag[]

Componentes del filtro:
1. Input de búsqueda (texto libre):
   - Placeholder: "Search in title or description..."
   - Debounce de 300ms
   - Icon de search
   - Crear test para validar correcta funcionalidad

2. Selector de tags:
   - Multi-select style "Chosen"
   - Mostrar tags disponibles con count
   - Poder añadir/remover múltiples
   - Badge para cada tag seleccionado
   - Crear test para validar correcta funcionalidad

3. Selector de rango de fechas:
   - Date input para "from"
   - Date input para "to"
   - Botón para limpiar fechas
   - Crear test para validar correcta funcionalidad

4. Botón "Clear all filters"

Diseño:
- Layout horizontal en desktop, vertical en mobile
- Sticky top cuando se hace scroll (opcional)
- Collapse en mobile con botón
- Estilos consistentes con Tailwind

Implementa debounce para la búsqueda de texto.
```

### Comando 15: Scroll Infinito

```
Implementa el scroll infinito para cargar más bookmarks:

1. frontend/src/hooks/useInfiniteScroll.ts:
   - Hook useInfiniteScroll(fetchNextPage, hasNextPage)
   - Usa Intersection Observer
   - Retorna ref para el elemento observador
   - Threshold de 0.5 (activar cuando 50% visible)
   - Cleanup apropiado
   - Crear test para validar correcta funcionalidad

2. Actualizar BookmarkGrid para usar scroll infinito:
   - Añadir div observador al final del grid
   - Mostrar "Loading more..." cuando fetchNextPage
   - Mostrar "No more bookmarks" cuando !hasNextPage
   - Crear test para validar correcta funcionalidad

Documentar el hook con ejemplos de uso.
```

---

## 🏗️ Fase 8: Páginas Principales

### Comando 16: Layout y Header

```
Crea el layout base y header de la aplicación:

1. frontend/src/components/layout/Header.tsx:
   Props: user, onLogout
   
   Contenido:
   - Logo/título de la app (izquierda)
   - Búsqueda rápida (centro, opcional)
   - Botón "+ New Bookmark" (derecha)
   - Info del usuario + botón Logout (derecha)
   
   Diseño:
   - Fixed top con backdrop blur
   - Shadow sutil
   - Responsive (collapse en mobile)
   - z-index apropiado

2. frontend/src/components/layout/Layout.tsx:
   Props: children
   
   - Render Header
   - Main content area con padding top (por header fixed)
   - Max width container centrado
   - Responsive padding

Estilos modernos con Tailwind.
```

### Comando 17: Página Principal (Home)

```
Crea la página principal de la aplicación:

frontend/src/pages/Home.tsx

Funcionalidad:
1. Estado para filters (useState)
2. Estado para modal de crear/editar (useState)
3. useBookmarks hook con filters
4. useTags hook
5. useCreateBookmark, useUpdateBookmark, useDeleteBookmark hooks
- Crear test para validar correcta funcionalidad

Estructura:
- BookmarkFilters con filters y onFilterChange
- Botón flotante "+ New" (mobile) o en header
- BookmarkGrid con bookmarks
- Modal con BookmarkForm al crear/editar
- Confirmation dialog al eliminar

Interacciones:
- Click en tag → añadir a filtro
- Click en "Edit" → abrir modal con bookmark
- Click en "Delete" → confirmar y eliminar
- Submit form → crear o actualizar según modo
- Scroll infinito automático
- Crear test para validar correcta funcionalidad

Manejo de estados:
- Loading initial
- Loading more
- Errors con toasts o mensajes
- Empty states

Diseño limpio y funcional.
```

### Comando 18: Routing completo

```
Configura el routing completo de la aplicación:

frontend/src/App.tsx

Estructura:
1. Wrap con AuthProvider
2. Wrap con QueryClientProvider (React Query)
3. Setup de react-router-dom:
   - Route "/" → ProtectedRoute → Home
   - Route "/login" → Login
   - Route "/register" → Register
   - Route "*" → NotFound (página 404)

4. Conditional rendering:
   - Si loading auth: mostrar spinner fullscreen
   - Si no autenticado en ruta protegida: redirect /login
   - Si autenticado en /login o /register: redirect /
   - Crear test para validar correcta funcionalidad

Configurar QueryClient con opciones apropiadas:
- staleTime, cacheTime, retry, etc.
- Crear test para validar correcta funcionalidad

Documentar la estructura de routing.
```

---

## 🎨 Fase 9: Polish y Mejoras

### Comando 19: Mejoras de UX

```
Añade mejoras de experiencia de usuario:

1. Toast notifications:
   - Instalar react-hot-toast o similar
   - Crear wrapper en utils/toast.ts
   - Usar en: create, update, delete, errors
   - Mensajes: "Bookmark saved!", "Bookmark deleted", "Error: ..."

2. Loading states mejorados:
   - Skeleton loaders para BookmarkCard
   - Shimmer effect
   - Smooth transitions

3. Empty states:
   - Mensaje cuando no hay bookmarks
   - CTA para crear el primero
   - Ilustración o icono grande

4. Error boundaries:
   - Component ErrorBoundary
   - Captura errores de React
   - Mostrar UI de error elegante

5. Optimistic updates:
   - Al crear bookmark, añadir optimistically
   - Al eliminar, remover optimistically
   - Revertir si falla

Implementa estas mejoras una por una con sus test
```

### Comando 20: Responsive y Accesibilidad

```
Mejora responsive design y accesibilidad:

1. Responsive:
   - Verificar que todos los componentes sean responsive
   - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
   - Grid columns: 1 (mobile), 2 (tablet), 3 (desktop)
   - Header collapse en mobile
   - Filters collapse en mobile
   - Touch-friendly tap targets (min 44px)

2. Accesibilidad:
   - Semantic HTML (header, main, nav, button, etc.)
   - ARIA labels donde necesario
   - Focus states visibles
   - Keyboard navigation (Tab, Enter, Esc)
   - Alt text en imágenes
   - Color contrast adecuado
   - Form labels correctos

3. Performance:
   - Lazy load de imágenes
   - Code splitting de rutas
   - Memoización donde apropiado
   - Debounce en búsquedas

Documenta las mejoras implementadas.
```

---

## 🚀 Fase 10: Deploy y CI/CD

### Comando 21: Configuración de Vercel

```
Prepara el proyecto para deploy en Vercel:

1. Crear frontend/vercel.json:
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "vite",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }

2. Asegurar que build funciona:
   - Verificar variables de entorno requeridas
   - Verificar que no hay errores de TypeScript
   - Verificar que assets se cargan correctamente

3. Crear .vercelignore:
   node_modules
   .env
   .env.local
   .git

4. Documentar en README:
   - Pasos para deploy manual
   - Variables de entorno necesarias
   - Cómo obtener las credenciales
```

### Comando 22: GitHub Actions

```
Crea los workflows de GitHub Actions:

1. .github/workflows/deploy-all.yml:
   - Trigger en tags v*.*.*
   - Job 1: deploy-frontend
     * Checkout, setup node
     * Install & build frontend
     * Deploy a Vercel con amondnet/vercel-action
   - Job 2: deploy-backend (needs: deploy-frontend)
     * Checkout, setup node
     * Install & build functions
     * Deploy con w9jds/firebase-action
   - Job 3: create-release (needs: [deploy-frontend, deploy-backend])
     * Crear GitHub release con tag

2. Documentar secrets necesarios:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   - FIREBASE_TOKEN
   - VITE_FIREBASE_* (todos)

3. Crear archivo DEPLOYMENT.md:
   - Cómo hacer un release
   - Comandos de git tag
   - Qué hace cada workflow
   - Cómo verificar el deploy
   - Troubleshooting común
```

---

## 📚 Fase 11: Documentación Final

### Comando 23: README completo

```
Crea un README.md completo para el proyecto:

Secciones:
1. Título y descripción
2. Features principales (lista con checkboxes)
3. Stack tecnológico
4. Requisitos previos
5. Instalación:
   - Clonar repo
   - Install dependencies (frontend y functions)
   - Configurar Firebase
   - Variables de entorno
6. Desarrollo local:
   - Iniciar emulators de Firebase
   - Iniciar frontend dev server
   - Comandos útiles
7. Deploy:
   - Setup de Vercel
   - Setup de Firebase
   - GitHub Actions
   - Crear release
8. Estructura del proyecto
9. Scripts disponibles
10. Troubleshooting
11. License y autor

Usa Markdown con formato claro. Añade badges si es posible.
```

### Comando 24: Documentación de desarrollo

```
Crea documentación adicional:

1. CONTRIBUTING.md:
   - Cómo contribuir
   - Coding standards
   - Commit message format
   - PR process

2. ARCHITECTURE.md:
   - Diagrama de arquitectura
   - Flujo de datos
   - Decisiones técnicas
   - Patrones utilizados

3. API.md:
   - Documentar cada Cloud Function
   - Parámetros y respuestas
   - Ejemplos de uso
   - Errores comunes

4. Actualizar código con JSDoc:
   - Todas las funciones públicas
   - Interfaces y tipos
   - Props de componentes importantes

Formato claro y profesional.
```

---

## ✅ Comandos de Verificación

### Comando 26: Checklist final

```
Verifica que todo esté completo:

1. Build:
   - Frontend build sin errores
   - Functions build sin errores
   - No hay warnings críticos de TypeScript

2. Functionality:
   - Auth funciona (login, register, logout)
   - CRUD de bookmarks funciona
   - Screenshots se capturan
   - Búsqueda y filtros funcionan
   - Scroll infinito funciona
   - Tags se actualizan correctamente

3. UI/UX:
   - Responsive en mobile, tablet, desktop
   - Loading states apropiados
   - Error handling visible
   - Navegación fluida

4. Config:
   - .env.example actualizado
   - firebase.json correcto
   - Rules de Firestore y Storage
   - GitHub Actions configurados

5. Docs:
   - README completo
   - Comentarios en código crítico
   - Variables de entorno documentadas

Crea un checklist en formato Markdown para verificar cada punto.
```

---

## 🎓 Tips para usar estos comandos

### Mejores prácticas:

1. **Ejecuta los comandos en orden** - están diseñados para construir incrementalmente

2. **No saltes pasos** - cada comando prepara el siguiente

3. **Revisa el código generado** - Claude Code es bueno pero no perfecto

4. **Prueba frecuentemente** - después de cada 2-3 comandos, prueba que funcione

5. **Commitea frecuentemente**:
   ```bash
   git add .
   git commit -m "feat: implement authentication"
   git push
   ```

6. **Usa branches para features grandes**:
   ```bash
   git checkout -b feature/screenshots
   # ... desarrollar
   git checkout main
   git merge feature/screenshots
   ```

### Estructura de commits recomendada:

```
feat: add user authentication
fix: resolve screenshot timeout issue
docs: update README with setup instructions
refactor: improve BookmarkCard component
style: format code with prettier
test: add unit tests for auth service
chore: update dependencies
```

### Variaciones de comandos:

Si algo no funciona perfecto, puedes pedir variaciones:

```
"El componente BookmarkCard que creaste no muestra bien los tags. 
Modifícalo para que los tags sean más pequeños y estén en una sola línea con scroll horizontal si no caben."

"La función captureScreenshot falla con timeout. Aumenta el timeout a 60s y añade mejor logging."

"El filtro de tags no funciona correctamente. Revisa la query de Firestore y corrígela."
```

---

## 🚀 Comandos Rápidos Post-Desarrollo

Una vez completado el desarrollo inicial, estos comandos te servirán para mantenimiento:

### Añadir nueva feature:

```
"Añade una feature para exportar todos los bookmarks a JSON. 
Crea un botón en el header que al hacer click descargue un archivo bookmarks.json 
con todos los bookmarks del usuario."
```

### Fix de bugs:

```
"El scroll infinito a veces carga duplicados. Investiga el problema en useInfiniteScroll 
y el hook useBookmarks. Muéstrame el código problemático y sugiéreme la solución."
```

### Mejoras de UI:

```
"Mejora el diseño del BookmarkCard:
- Añade animación al hacer hover
- Muestra un badge de 'New' si el bookmark tiene menos de 24 horas
- Añade un botón para copiar la URL al clipboard
- Mejora la tipografía"
```

### Optimizaciones:

```
"Optimiza el performance de la página Home:
- Implementa virtualización para la lista de bookmarks
- Añade caché más agresivo en React Query
- Lazy load de imágenes con intersection observer
- Reduce el tamaño del bundle analizando con vite-bundle-visualizer"
```

---

## 📦 Próximo Nivel

Después de completar todo, considera estas extensiones:

1. **Extensión de navegador** para guardar bookmarks rápido
2. **PWA** para usar offline
3. **Compartir colecciones** públicas
4. **API pública** para integraciones
5. **Importar** desde Pocket/Instapaper
6. **IA para sugerencias** de tags o categorías
7. **Full-text search** con Algolia o MeiliSearch
8. **Analytics** de uso

Cada una podría ser una nueva serie de comandos para Claude Code.

---

**¡Buena suerte con tu proyecto! 🚀**
