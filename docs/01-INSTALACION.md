# 🌱 Cómo Ejecutar el Seed

## Prerequisitos

1. **MongoDB debe estar corriendo**
   - Si usas Docker: `docker-compose up -d` (desde la raíz del proyecto)
   - O MongoDB local en el puerto 27017

2. **Variables de entorno configuradas**
   - Asegúrate de tener un archivo `.env` en `backend/` con `MONGODB_URI`

## Ejecutar el Seed

### Opción 1: Desde la raíz del proyecto

```bash
cd backend
npm run seed:ventas
```

### Opción 2: Desde el directorio backend

```bash
npm run seed:ventas
```

## ¿Qué hace el seed?

El script `seed-ventas.ts` crea:

1. **10 productos** de ejemplo (Martillo, Destornillador, Clavos, etc.)
2. **Ventas simuladas** de un mes completo (~30 días)
3. **Total aproximado**: $20,000,000 ARS en ventas
4. **Distribución**:
   - Ventas en efectivo
   - Transferencias a cuenta Abdul
   - Transferencias a cuenta Osvaldo
   - Pagos con tarjeta (crédito/débito)
5. **Gastos diarios** simulados
6. **Retiros de socios** (Abdul y Osvaldo)
7. **Proveedores** de ejemplo

## Verificar que funcionó

1. **Revisa la consola** - Deberías ver mensajes como:
   ```
   🌱 Iniciando seed completo del sistema...
   📦 Creando productos...
   💰 Creando ventas...
   ✅ Seed completado exitosamente!
   ```

2. **Verifica en MongoDB**:
   - Conecta a MongoDB
   - Revisa las colecciones: `ventas`, `productos`, `gastos_diarios`, etc.

3. **Verifica en el frontend**:
   - Abre el Dashboard
   - Deberías ver datos en los gráficos y reportes

## Solución de Problemas

### Error: "Cannot connect to MongoDB"

**Solución:**
- Verifica que MongoDB esté corriendo: `docker ps` (si usas Docker)
- Verifica la `MONGODB_URI` en tu `.env`
- Prueba conectarte manualmente: `mongosh mongodb://localhost:27017/ventas-ferreteria`

### Error: "Module not found" o errores de TypeScript

**Solución:**
```bash
cd backend
npm install
```

### El seed se ejecuta pero no crea datos

**Solución:**
- Revisa los logs en la consola para ver errores específicos
- Verifica que las variables de entorno estén correctas
- Asegúrate de que la base de datos esté vacía o que no haya conflictos

## Limpiar datos antes de ejecutar el seed

Si quieres empezar desde cero:

```bash
# Conecta a MongoDB
mongosh mongodb://localhost:27017/ventas-ferreteria

# Elimina las colecciones
db.ventas.deleteMany({})
db.productos.deleteMany({})
db.gastos_diarios.deleteMany({})
db.retiros_socios.deleteMany({})
db.proveedores.deleteMany({})
db.cierre_cajas.deleteMany({})
```

Luego ejecuta el seed nuevamente.

---

**¡Listo!** Una vez ejecutado el seed, tendrás datos de ejemplo para probar todas las funcionalidades del sistema.


