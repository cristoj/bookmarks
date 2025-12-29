#!/bin/bash

# Script helper para ejecutar la importación de bookmarks
# Uso: ./scripts/run-import.sh [limit]
# Ejemplo: ./scripts/run-import.sh 1

# Verificar que existe el archivo de credenciales
CREDENTIALS_FILE="firebase-credentials.json"

if [ ! -f "$CREDENTIALS_FILE" ]; then
  echo "❌ Error: No se encontró el archivo de credenciales"
  echo ""
  echo "Por favor descarga las credenciales desde:"
  echo "https://console.firebase.google.com/project/bookmarks-cristoj/settings/serviceaccounts/adminsdk"
  echo ""
  echo "Y guárdalas como: firebase-credentials.json"
  exit 1
fi

# Configurar variable de entorno
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/$CREDENTIALS_FILE"

# Ejecutar script
if [ -n "$1" ]; then
  echo "Importando $1 bookmark(s)..."
  npm run import-bookmarks -- --limit=$1
else
  echo "Importando TODOS los bookmarks..."
  npm run import-bookmarks
fi
