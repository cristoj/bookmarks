# 🔖 Bookmarks Chrome Extension

Extensión de Chrome para guardar bookmarks instantáneamente desde cualquier página web.

## ✨ Características

- 💾 **Guardar con 2 clics** - Click en el icono, click en Save
- 🏷️ **Tag autocomplete** - Sugerencias de tus tags existentes
- 🔐 **Autenticación Firebase** - Login una vez, sesión persistente
- ⚡ **Auto-completado** - URL y título se rellenan automáticamente
- 📦 **Cache inteligente** - Tags cacheados localmente (1 hora)
- 🎨 **UI moderna** - Diseño limpio y responsive

## 🚀 Instalación (Desarrollo)

### Prerrequisitos

- Google Chrome (versión 88 o superior)
- Cuenta en la app web de Bookmarks

### Pasos

1. **Clonar el repositorio** (si aún no lo has hecho):
   ```bash
   git clone https://github.com/tu-usuario/bookmarks.git
   cd bookmarks
   ```

2. **Abrir Chrome Extensions**:
   - Abre Chrome
   - Ve a `chrome://extensions/`
   - Activa el "Developer mode" (esquina superior derecha)

3. **Cargar la extensión**:
   - Click en "Load unpacked"
   - Selecciona la carpeta `bookmarks/extension/`
   - La extensión aparecerá en la lista

4. **Pin la extensión** (opcional):
   - Click en el icono de puzzle 🧩 en la barra de Chrome
   - Click en el pin 📌 junto a "Bookmarks Saver"
   - Ahora el icono aparece siempre en la barra

## 📖 Cómo Usar

### Primera vez (Login)

1. Click en el icono de la extensión
2. Ingresa tu email y password (misma cuenta de la web app)
3. Click "Login"
4. La sesión queda guardada (no necesitas login de nuevo)

### Guardar un Bookmark

1. Navega a la página que quieres guardar
2. Click en el icono de la extensión
3. Verás la URL y título ya pre-llenados
4. (Opcional) Añade descripción
5. Empieza a escribir tags → aparecen sugerencias
6. Click "Save Bookmark"
7. ¡Listo! 🎉

### Logout

1. Click en el icono de la extensión
2. Click en "Logout"

## 🏗️ Estructura del Proyecto

```
extension/
├── manifest.json          # Configuración de la extensión
├── popup.html             # UI del popup
├── popup.js               # Lógica principal
├── background.js          # Service worker
├── firebase-config.js     # Configuración Firebase
├── styles.css             # Estilos
├── icons/                 # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── README.md              # Este archivo
```

## 🔧 Configuración

### Firebase Config

El archivo `firebase-config.js` contiene las credenciales públicas de Firebase. Estas son **seguras de compartir** porque:

- Son credenciales públicas (se envían al navegador de todos modos)
- La seguridad real está en Firestore Rules y Cloud Functions
- No permiten acceso directo a la base de datos

Si necesitas cambiar el proyecto Firebase:

1. Edita `firebase-config.js`
2. Reemplaza con las credenciales de tu proyecto
3. Recarga la extensión en `chrome://extensions/`

## 🐛 Troubleshooting

### "User must be authenticated"

- **Problema**: No has iniciado sesión
- **Solución**: Click en Logout y vuelve a hacer login

### "Failed to load tags"

- **Problema**: No hay conexión a Firebase o no tienes tags aún
- **Solución**: Verifica tu conexión. La extensión funciona igual sin tags

### El popup no abre

- **Problema**: Error en la extensión
- **Solución**:
  1. Ve a `chrome://extensions/`
  2. Click en "Errors" debajo de la extensión
  3. Revisa el error en consola
  4. Recarga la extensión

### "Permission denied" en Firestore

- **Problema**: Las Security Rules bloquean el acceso
- **Solución**: Verifica que estás autenticado y que las reglas permiten acceso

## 🔐 Seguridad

### Datos que se almacenan localmente

La extensión usa `chrome.storage.local` para:
- ✅ User info (uid, email)
- ✅ Tags cache (1 hora)

**NO almacena**:
- ❌ Passwords
- ❌ Auth tokens sensibles (manejados por Firebase)
- ❌ Bookmarks completos

### Permisos de la extensión

```json
"permissions": [
  "activeTab",    // Leer URL/título de la pestaña actual
  "storage"       // Guardar sesión y cache
]

"host_permissions": [
  "*.firebaseapp.com",      // Autenticación
  "*.cloudfunctions.net",   // Cloud Functions
  "*.googleapis.com"        // Firebase APIs
]
```

Todos los permisos son necesarios para la funcionalidad básica.

## 🚧 Desarrollo

### Hacer cambios

1. Edita los archivos en `extension/`
2. Ve a `chrome://extensions/`
3. Click en el icono de reload ↻ de la extensión
4. Prueba tus cambios

### Debugging

#### Popup
- Click derecho en el icono de la extensión
- "Inspect popup"
- Se abre DevTools para el popup

#### Background Service Worker
- Ve a `chrome://extensions/`
- Click en "Service Worker" debajo de la extensión
- Se abre DevTools para el background script

#### Consola
- Todos los `console.log()` aparecen en DevTools
- Revisa errores en la pestaña "Console"

### Testing

```bash
# No hay tests automatizados aún (MVP)
# Testing manual:
1. Cargar extensión en Chrome
2. Probar login
3. Probar crear bookmark
4. Probar tag autocomplete
5. Probar logout
```

## 📦 Build para Producción

Esta extensión no requiere build porque usa JavaScript vanilla.

Para empaquetar y publicar:

```bash
# 1. Crear ZIP
cd bookmarks/extension
zip -r bookmarks-extension.zip . -x "*.git*" -x "README.md"

# 2. El archivo bookmarks-extension.zip está listo para:
#    - Chrome Web Store
#    - Distribución directa
```

## 🌐 Publicar en Chrome Web Store

1. **Crear cuenta de desarrollador** ($5 one-time fee)
   - https://chrome.google.com/webstore/devconsole

2. **Preparar assets**:
   - ✅ Icons (ya están en `icons/`)
   - Screenshots (1280x800): Captura el popup en uso
   - Promo image (440x280): Banner promocional

3. **Subir extensión**:
   - "New Item" → Subir `bookmarks-extension.zip`
   - Completar descripción
   - Añadir screenshots
   - Submit for review

4. **Esperar aprobación** (1-3 días)

## 📊 Roadmap

### ✅ V1 (MVP) - Completado
- [x] Login/logout
- [x] Crear bookmark
- [x] Tag autocomplete
- [x] Cache de tags
- [x] Auto-rellenar URL y título

### 🔮 V2 - Futuro
- [ ] Options page (configuración)
- [ ] Keyboard shortcut (Ctrl+Shift+S)
- [ ] Context menu (right-click → Save bookmark)
- [ ] Badge count (número de bookmarks guardados hoy)
- [ ] Dark mode
- [ ] i18n (Inglés + Español)
- [ ] Tests automatizados

## 🤝 Contribuir

Esta extensión es parte del monorepo de Bookmarks:

```
bookmarks/
├── frontend/     # App web
├── functions/    # Cloud Functions
└── extension/    # Esta extensión ⬅️
```

Para contribuir:
1. Fork el repositorio
2. Crea una branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE en la raíz del proyecto

## 🔗 Links Relacionados

- [App Web](https://bookmarks-cristoj.web.app)
- [Documentación Completa](../docs/chrome-extension-mvp.md)
- [PWA Share Target](../docs/pwa-share-target.md) (para mobile)
- [Guía de Seguridad](../docs/security-guide.md)

## 📧 Soporte

¿Problemas? Abre un issue en GitHub o contacta a través de la app web.

---

**Hecho con ❤️ usando vanilla JavaScript y Firebase**
