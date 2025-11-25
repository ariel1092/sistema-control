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
node dist/main.js

