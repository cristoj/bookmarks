# 🧪 Guía de Testing - Extensión Chrome

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:
- [ ] Google Chrome instalado (versión 88+)
- [ ] Cuenta registrada en https://bookmarks-cristoj.web.app
- [ ] Al menos 1-2 bookmarks ya creados en la app web (para probar tag autocomplete)

---

## 📋 Paso 1: Cargar la Extensión

### 1.1 Abrir Chrome Extensions

```
1. Abre Google Chrome
2. En la barra de direcciones, escribe: chrome://extensions/
3. Presiona Enter
```

### 1.2 Activar Developer Mode

```
1. En la esquina superior derecha, verás un toggle "Developer mode"
2. Actívalo (debe ponerse azul)
3. Aparecerán nuevos botones: "Load unpacked", "Pack extension", etc.
```

### 1.3 Cargar la Extensión

```
1. Click en "Load unpacked"
2. Navega a: /home/cristo/www/html/bookmarks/extension/
3. Click "Select Folder" o "Abrir"
4. La extensión aparecerá en la lista con el nombre "Bookmarks Saver"
```

### 1.4 Verificar que Cargó Correctamente

**Deberías ver:**
- ✅ Icono de bookmark morado
- ✅ Nombre: "Bookmarks Saver"
- ✅ Descripción: "Save and organize your favorite web pages instantly"
- ✅ Version: 1.0.0
- ✅ **SIN errores** en rojo

**Si ves errores:**
```
1. Click en "Errors" (texto en rojo)
2. Lee el error
3. Copia el mensaje y compártelo para debugging
```

### 1.5 Pin la Extensión (Opcional pero Recomendado)

```
1. En la barra de Chrome, verás un icono de puzzle 🧩
2. Click en el puzzle
3. Busca "Bookmarks Saver"
4. Click en el icono de pin 📌 al lado
5. Ahora el icono de bookmark aparece siempre en la barra
```

---

## 📋 Paso 2: Primer Login

### 2.1 Abrir el Popup

```
1. Click en el icono de la extensión (bookmark morado)
2. Debe abrirse un popup blanco con gradiente morado
3. Verás el formulario de login
```

**Tamaño esperado del popup:** ~420x500px

**Si el popup no abre:**
- Right-click en el icono → "Inspect popup"
- Revisa la consola en DevTools para ver errores

### 2.2 Ingresar Credenciales

```
1. Email: [tu email registrado]
2. Password: [tu password]
3. Click "Login"
```

**Loading esperado:**
- El botón debe mostrar estado de carga
- Debe aparecer un spinner o mensaje "Loading..."

### 2.3 Verificar Login Exitoso

**Después del login, deberías ver:**
- ✅ Formulario de "Save Bookmark" (no login form)
- ✅ Campo URL (read-only, con URL de la página actual)
- ✅ Campo Title (con título de la página actual)
- ✅ Campo Description (vacío)
- ✅ Campo Tags con hint "Start typing tags..."
- ✅ Botón "💾 Save Bookmark"
- ✅ Botón "Logout"

**Si ves error de login:**
- Verifica que el email/password sean correctos
- Revisa que tengas internet
- Abre DevTools del popup (right-click → Inspect popup)
- Revisa la consola para ver el error exacto

---

## 📋 Paso 3: Probar Tag Autocomplete

### 3.1 Preparación

**Primero, asegúrate de tener tags existentes:**
```
1. Abre https://bookmarks-cristoj.web.app
2. Verifica que tengas al menos 2-3 bookmarks con tags
3. Anota algunos tags que ya usaste (ej: "javascript", "react", "tutorial")
```

### 3.2 Probar Autocomplete

```
1. En el popup de la extensión, click en el campo "Tags"
2. Empieza a escribir el nombre de un tag existente
   Ejemplo: escribe "jav"
3. Deberías ver una lista desplegable con sugerencias:
   - javascript
   - java
   - javafx (si existen)
```

**Si NO ves sugerencias:**

**Opción A: Tags aún no cargaron**
```
1. Cierra el popup
2. Abre nuevamente (click en el icono)
3. Espera 1-2 segundos
4. Intenta de nuevo
```

**Opción B: Revisar cache**
```
1. Right-click en icono → Inspect popup
2. En DevTools, ve a: Application → Storage → Local Storage → chrome-extension://...
3. Busca la key "tags"
4. Debería tener un array con tus tags
```

**Opción C: Revisar consola**
```
1. Right-click en icono → Inspect popup
2. Ve a Console
3. Busca errores relacionados con "getTags" o "loadTags"
```

### 3.3 Probar Tags Múltiples

```
1. Escribe un tag, ej: "javascript"
2. Añade una coma: "javascript,"
3. Escribe otro tag: "javascript, react"
4. Deberías ver sugerencias para "react"
```

---

## 📋 Paso 4: Guardar un Bookmark

### 4.1 Navegar a una Página de Prueba

```
1. Abre una nueva pestaña
2. Ve a cualquier sitio, por ejemplo:
   - https://github.com
   - https://stackoverflow.com
   - https://dev.to
```

### 4.2 Abrir la Extensión

```
1. Click en el icono de la extensión
2. Verifica que URL y título se auto-completaron con la página actual
```

**URL esperada:** https://github.com (o el sitio que abriste)
**Título esperado:** GitHub (o el título de la página)

### 4.3 Completar el Formulario

```
1. Title: Deja el auto-completado o edítalo
2. Description: "Prueba desde extensión Chrome" (opcional)
3. Tags: "test, extension, prueba" (usa autocomplete si quieres)
4. Click "💾 Save Bookmark"
```

### 4.4 Verificar Guardado Exitoso

**Deberías ver:**
- ✅ Mensaje verde: "✅ Bookmark saved successfully!"
- ✅ Popup pregunta: "Bookmark saved! Open Bookmarks App?"

**Opciones:**
- Click "OK" → Se abre la app web en nueva pestaña
- Click "Cancel" → El popup permanece abierto

**Si ves error:**
```
Posibles causas:
- "URL and Title are required" → Falta rellenar campos
- "User must be authenticated" → Sesión expiró, haz logout y login de nuevo
- "Failed to create bookmark" → Revisa la consola para ver error específico
```

---

## 📋 Paso 5: Verificar en la App Web

### 5.1 Abrir la App Web

```
1. Navega a: https://bookmarks-cristoj.web.app
2. Deberías estar ya autenticado (misma cuenta)
```

### 5.2 Buscar el Bookmark Guardado

```
1. En la lista de bookmarks, busca el que acabas de crear
2. Debería aparecer en la parte superior (ordenado por fecha)
```

**Verifica que tenga:**
- ✅ URL correcta (ej: https://github.com)
- ✅ Título correcto (ej: GitHub)
- ✅ Descripción (si la añadiste)
- ✅ Tags correctos (ej: "test", "extension", "prueba")
- ✅ Screenshot status: "pending" o "completed"

---

## 📋 Paso 6: Probar Logout

### 6.1 Logout desde la Extensión

```
1. Abre el popup de la extensión
2. Click en "Logout"
3. Deberías volver al formulario de login
```

### 6.2 Verificar Sesión Cerrada

```
1. Cierra el popup
2. Abre nuevamente
3. Debería mostrar el formulario de login (no el de bookmark)
```

### 6.3 Verificar Cache Limpio

```
1. Right-click en icono → Inspect popup
2. Application → Storage → Local Storage
3. Verifica que "user" y "tags" ya no existen
```

---

## 📋 Paso 7: Probar Sesión Persistente

### 7.1 Login de Nuevo

```
1. Ingresa email y password
2. Click "Login"
3. Popup muestra formulario de bookmark
```

### 7.2 Cerrar y Reabrir

```
1. Cierra el popup (click fuera o presiona Esc)
2. Cierra Chrome completamente
3. Abre Chrome de nuevo
4. Click en el icono de la extensión
```

**Resultado esperado:**
- ✅ Deberías ver el formulario de bookmark directamente
- ✅ NO debería pedir login de nuevo
- ✅ Tags deberían seguir funcionando (cache de 1 hora)

---

## 🐛 Debugging Avanzado

### DevTools del Popup

```
1. Right-click en icono → "Inspect popup"
2. Se abre DevTools
3. Pestañas útiles:
   - Console: Ver errores y logs
   - Network: Ver requests a Firebase
   - Application: Ver storage local
```

### DevTools del Background Service Worker

```
1. Ve a: chrome://extensions/
2. Busca "Bookmarks Saver"
3. Click en "Service Worker" (debe decir "active")
4. Se abre DevTools del background
5. Revisa Console para ver logs
```

### Recargar la Extensión

Si haces cambios en el código:
```
1. Ve a: chrome://extensions/
2. Busca "Bookmarks Saver"
3. Click en el icono de reload ↻
4. Cierra y abre el popup de nuevo
```

---

## ✅ Checklist Final de Testing

### Funcionalidades Básicas
- [ ] Extensión carga sin errores
- [ ] Icono aparece en la barra de Chrome
- [ ] Popup abre correctamente
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Sesión persiste después de cerrar Chrome

### Auto-completado
- [ ] URL se rellena automáticamente
- [ ] Título se rellena automáticamente
- [ ] Tags autocomplete funciona
- [ ] Tags múltiples (separados por coma) funcionan

### Guardar Bookmarks
- [ ] Bookmark se guarda correctamente
- [ ] Aparece mensaje de éxito
- [ ] Bookmark aparece en la app web
- [ ] Tags se guardan correctamente
- [ ] Descripción se guarda correctamente

### Edge Cases
- [ ] Error si URL/título vacíos
- [ ] Error si no autenticado
- [ ] Manejo de error de red
- [ ] Tags cache funciona
- [ ] Formulario se limpia después de guardar

---

## 📊 Reporte de Bugs

Si encuentras un bug, reporta con esta información:

```markdown
### Bug: [Título breve]

**Pasos para reproducir:**
1. ...
2. ...
3. ...

**Resultado esperado:**
...

**Resultado actual:**
...

**Screenshot/Error:**
[Pega screenshot o mensaje de error de consola]

**Información adicional:**
- Chrome version: [ver en chrome://version/]
- Extensión version: 1.0.0
- Sistema operativo: [Linux/Windows/Mac]
```

---

## 🎉 Testing Completado

Si todos los tests pasaron:
- ✅ La extensión funciona correctamente
- ✅ Está lista para uso diario
- ✅ Puedes empezar a guardar bookmarks reales

**Próximos pasos opcionales:**
1. Personalizar iconos (reemplazar PNGs en `icons/`)
2. Implementar PWA Share Target para mobile
3. Publicar en Chrome Web Store
4. Añadir features adicionales (V2)

---

**¡Felicitaciones!** 🎉 Tu extensión está funcionando.
