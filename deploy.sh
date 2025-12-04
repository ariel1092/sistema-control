#!/bin/bash

# Script de despliegue a producción
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando despliegue a producción..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi

# Verificar archivo .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
    echo "Creando .env desde ejemplo..."
    cat > .env << EOF
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=CHANGE_THIS_PASSWORD
JWT_SECRET=CHANGE_THIS_JWT_SECRET
CORS_ORIGIN=https://tu-dominio.com
BACKEND_PORT=3000
MONGO_PORT=27017
EOF
    echo -e "${YELLOW}⚠️  Por favor, edita el archivo .env con tus valores reales antes de continuar${NC}"
    exit 1
fi

# Construir imágenes
echo -e "${GREEN}📦 Construyendo imágenes Docker...${NC}"
docker-compose -f docker-compose.prod.yml build

# Detener servicios existentes
echo -e "${GREEN}🛑 Deteniendo servicios existentes...${NC}"
docker-compose -f docker-compose.prod.yml down

# Iniciar servicios
echo -e "${GREEN}🚀 Iniciando servicios...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
echo -e "${GREEN}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar health check
echo -e "${GREEN}🏥 Verificando health check...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/api/v1/health &> /dev/null; then
        echo -e "${GREEN}✅ Backend está funcionando correctamente${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend no responde después de 30 intentos${NC}"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    sleep 2
done

# Crear usuario administrador
echo -e "${GREEN}👤 Creando usuario administrador...${NC}"
read -p "¿Deseas crear un usuario administrador? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker-compose -f docker-compose.prod.yml exec -T backend npm run seed:admin
fi

# Mostrar estado
echo -e "${GREEN}📊 Estado de los servicios:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "  1. Verifica que el backend esté funcionando: http://localhost:3000/api/v1/health"
echo "  2. Configura el frontend con la URL del backend"
echo "  3. Revisa los logs si hay problemas: docker-compose -f docker-compose.prod.yml logs -f"

