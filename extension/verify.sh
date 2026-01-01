#!/bin/bash
# Script de verificación pre-testing para la extensión Chrome

echo "🔍 Verificando Extensión Chrome - Bookmarks Saver"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Función para check
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1 ${RED}(FALTA)${NC}"
    ((ERRORS++))
  fi
}

# Función para check con contenido
check_file_content() {
  if [ -f "$1" ]; then
    if grep -q "$2" "$1"; then
      echo -e "${GREEN}✓${NC} $1 contiene '$2'"
    else
      echo -e "${YELLOW}⚠${NC} $1 NO contiene '$2'"
      ((WARNINGS++))
    fi
  fi
}

echo "1. Verificando archivos obligatorios..."
echo "---------------------------------------"
check_file "manifest.json"
check_file "popup.html"
check_file "popup.js"
check_file "background.js"
check_file "firebase-config.js"
check_file "styles.css"
check_file "icons/icon16.png"
check_file "icons/icon48.png"
check_file "icons/icon128.png"
echo ""

echo "2. Verificando manifest.json..."
echo "--------------------------------"
if [ -f "manifest.json" ]; then
  check_file_content "manifest.json" "manifest_version"
  check_file_content "manifest.json" "Bookmarks Saver"
  check_file_content "manifest.json" "popup.html"
  check_file_content "manifest.json" "background.js"

  # Verificar JSON válido
  if command -v jq &> /dev/null; then
    if jq empty manifest.json 2>/dev/null; then
      echo -e "${GREEN}✓${NC} manifest.json es JSON válido"
    else
      echo -e "${RED}✗${NC} manifest.json tiene errores de sintaxis"
      ((ERRORS++))
    fi
  else
    echo -e "${YELLOW}⚠${NC} jq no instalado, no se puede verificar JSON"
  fi
fi
echo ""

echo "3. Verificando Firebase config..."
echo "----------------------------------"
if [ -f "firebase-config.js" ]; then
  check_file_content "firebase-config.js" "firebaseConfig"
  check_file_content "firebase-config.js" "apiKey"
  check_file_content "firebase-config.js" "projectId"
  check_file_content "firebase-config.js" "bookmarks-cristoj"
fi
echo ""

echo "4. Verificando popup.html..."
echo "-----------------------------"
if [ -f "popup.html" ]; then
  check_file_content "popup.html" "login-form"
  check_file_content "popup.html" "bookmark-form"
  check_file_content "popup.html" "firebase-app-compat.js"
  check_file_content "popup.html" "popup.js"
  check_file_content "popup.html" "styles.css"
fi
echo ""

echo "5. Verificando popup.js..."
echo "--------------------------"
if [ -f "popup.js" ]; then
  check_file_content "popup.js" "firebase.initializeApp"
  check_file_content "popup.js" "auth.onAuthStateChanged"
  check_file_content "popup.js" "createBookmark"
  check_file_content "popup.js" "getTags"
  check_file_content "popup.js" "loadTags"
fi
echo ""

echo "6. Verificando tamaños de iconos..."
echo "------------------------------------"
if command -v file &> /dev/null; then
  for icon in icons/icon16.png icons/icon48.png icons/icon128.png; do
    if [ -f "$icon" ]; then
      size=$(file "$icon" | grep -oP '\d+\s*x\s*\d+' | head -1)
      echo -e "${GREEN}✓${NC} $icon - $size"
    fi
  done
else
  echo -e "${YELLOW}⚠${NC} 'file' command no disponible"
fi
echo ""

echo "7. Verificando permisos de archivos..."
echo "---------------------------------------"
for file in manifest.json popup.html popup.js background.js firebase-config.js styles.css; do
  if [ -f "$file" ]; then
    if [ -r "$file" ]; then
      echo -e "${GREEN}✓${NC} $file es legible"
    else
      echo -e "${RED}✗${NC} $file NO es legible"
      ((ERRORS++))
    fi
  fi
done
echo ""

echo "8. Verificando estructura de directorios..."
echo "--------------------------------------------"
if [ -d "icons" ]; then
  echo -e "${GREEN}✓${NC} Directorio icons/ existe"
else
  echo -e "${RED}✗${NC} Directorio icons/ NO existe"
  ((ERRORS++))
fi
echo ""

echo "=================================================="
echo "📊 RESUMEN"
echo "=================================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ Todo está correcto!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Abre Chrome y ve a: chrome://extensions/"
  echo "2. Activa 'Developer mode'"
  echo "3. Click 'Load unpacked'"
  echo "4. Selecciona esta carpeta: $(pwd)"
  echo "5. Lee TESTING-GUIDE.md para instrucciones detalladas"
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ ${WARNINGS} advertencia(s)${NC}"
  echo "La extensión debería funcionar, pero revisa las advertencias."
else
  echo -e "${RED}✗ ${ERRORS} error(es) encontrado(s)${NC}"
  echo -e "${YELLOW}⚠ ${WARNINGS} advertencia(s)${NC}"
  echo ""
  echo "Por favor, corrige los errores antes de cargar la extensión."
fi

echo ""
echo "Para más información, lee: TESTING-GUIDE.md"
