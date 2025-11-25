#!/bin/bash
set -e

echo "=== Verificando directorio actual ==="
pwd

echo "=== Listando archivos en el directorio actual ==="
ls -la

echo "=== Verificando si existe dist/ ==="
if [ -d "dist" ]; then
    echo "dist/ existe"
    echo "=== Contenido de dist/ ==="
    ls -la dist/
    echo "=== Buscando main.js ==="
    find dist -name "main.*" -type f || echo "No se encontró main.js"
else
    echo "ERROR: dist/ no existe"
    exit 1
fi

echo "=== Ejecutando aplicación ==="
# El archivo main.js está en dist/src/main.js debido a la estructura de TypeScript
if [ -f "dist/src/main.js" ]; then
    echo "Ejecutando desde dist/src/main.js"
    node dist/src/main.js
elif [ -f "dist/main.js" ]; then
    echo "Ejecutando desde dist/main.js"
    node dist/main.js
else
    echo "ERROR: No se encontró main.js ni en dist/src/main.js ni en dist/main.js"
    exit 1
fi

