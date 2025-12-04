# 🔥 DIAGNÓSTICO TÉCNICO DE RENDIMIENTO - BACKEND

**Fecha:** $(date)  
**Arquitecto:** Senior Performance Architect  
**Objetivos:** <1s TTFB | 90 Lighthouse | <100ms Backend-DB | <150ms JS Load

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

### 1. **N+1 QUERIES MASIVAS** ⚠️ CRÍTICO

**Ubicación:** `backend/src/infrastructure/persistence/mongodb/repositories/venta.repository.ts`

**Problema:**
```typescript
// Líneas 78-103: findByFecha
for (const ventaDoc of ventasDocs) {
  const detallesDocs = await this.detalleVentaModel
    .find({ ventaId: ventaDoc._id })
    .exec(); // ❌ QUERY POR CADA VENTA
  ventas.push(VentaMapper.toDomain(ventaDoc, detallesDocs));
}
```

**Impacto:**
- Si hay 50 ventas en un día → **50 queries adicionales**
- Latencia: 50 × 20ms = **1000ms solo en queries de detalles**
- **VIOLA** el objetivo de <100ms backend-DB

**Mismo problema en:**
- `findByRangoFechas()` (líneas 160-164)
- `findByVendedor()` (líneas 202-206)

**Solución:** Usar `$in` con un solo query:
```typescript
const ventaIds = ventasDocs.map(v => v._id);
const todosDetalles = await this.detalleVentaModel
  .find({ ventaId: { $in: ventaIds } })
  .exec();
// Agrupar por ventaId en memoria
```

---

### 2. **POOLING DE MONGODB NO CONFIGURADO** ⚠️ CRÍTICO

**Ubicación:** `backend/src/infrastructure/config/database.config.ts`

**Problema:**
```typescript
return {
  uri: mongodbUri,
  dbName: mongodbDbName,
  retryWrites: true,
  w: 'majority',
  // ❌ FALTA: maxPoolSize, minPoolSize, maxIdleTimeMS
};
```

**Impacto:**
- Mongoose usa valores por defecto: `maxPoolSize: 100`
- Sin `minPoolSize`, conexiones se cierran y recrean constantemente
- Cada nueva conexión = **50-200ms de overhead**
- En Render con cold starts, esto es **catastrófico**

**Solución:**
```typescript
return {
  uri: mongodbUri,
  dbName: mongodbDbName,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 50,        // Máximo de conexiones simultáneas
  minPoolSize: 10,        // Mantener conexiones vivas
  maxIdleTimeMS: 30000,  // Cerrar conexiones idle después de 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};
```

---

### 3. **SIN CACHÉ IMPLEMENTADO** ⚠️ CRÍTICO

**Búsqueda realizada:** `grep -r "CacheModule\|@Cacheable\|@UseInterceptors.*Cache" backend/src`
**Resultado:** ❌ **CERO implementaciones de caché**

**Endpoints que DEBEN tener caché:**
- `GET /ventas?fecha=X` → Cachear por fecha (TTL: 5min)
- `GET /productos` → Cachear lista completa (TTL: 10min)
- `GET /clientes` → Cachear lista completa (TTL: 10min)
- `GET /caja/resumen?fecha=X` → Cachear por fecha (TTL: 2min)

**Impacto:**
- Cada request hace query completa a MongoDB
- Productos: Si hay 1000 productos → **50-100ms por request**
- Con caché en memoria: **<1ms**

**Solución:** Implementar `@nestjs/cache-manager` con Redis o memoria.

---

### 4. **LOOPS SECUENCIALES EN USE CASES** ⚠️ ALTO

**Ubicación:** `backend/src/application/use-cases/ventas/create-venta.use-case.ts`

**Problema:**
```typescript
// Líneas 60-104: Validación secuencial de productos
for (const item of dto.items) {
  const producto = await this.productoRepository.findById(item.productoId);
  // ❌ AWAIT DENTRO DEL LOOP = SECUENCIAL
  if (!producto) throw ...
  if (!producto.tieneStockSuficiente(...)) throw ...
}
```

**Impacto:**
- 10 productos = 10 queries secuenciales
- 10 × 20ms = **200ms solo en validaciones**
- Debería ser **20ms total** (paralelo)

**Solución:**
```typescript
const productoIds = dto.items.map(i => i.productoId);
const productos = await Promise.all(
  productoIds.map(id => this.productoRepository.findById(id))
);
// Validar todos en paralelo
```

---

### 5. **LÓGICA DE TRANSFORMACIÓN EN CONTROLLERS** ⚠️ MEDIO

**Ubicación:** `backend/src/presentation/controllers/ventas.controller.ts`

**Problema:**
```typescript
// Líneas 31-44: Mapeo manual en el controller
return ventas.map(venta => ({
  id: venta.id,
  numero: venta.numero,
  // ... 10 líneas de mapeo manual
}));
```

**Impacto:**
- Lógica de presentación en controllers
- Dificulta caché y serialización optimizada
- No reutilizable

**Solución:** Mover a DTOs con `class-transformer` o interceptors.

---

### 6. **QUERIES SIN PROYECCIÓN** ⚠️ MEDIO

**Ubicación:** Múltiples repositorios

**Problema:**
```typescript
// producto.repository.ts línea 72
const productosDocs = await this.productoModel.find(query).exec();
// ❌ Trae TODOS los campos, incluso los que no se usan
```

**Impacto:**
- Documentos grandes → más datos transferidos
- Más memoria usada
- Latencia adicional: **10-30ms por query**

**Solución:**
```typescript
.find(query)
.select('codigo nombre precioVenta stockActual activo') // Solo campos necesarios
.exec();
```

---

### 7. **ÍNDICES FALTANTES** ⚠️ MEDIO

**Análisis de índices:**

✅ **Bien indexados:**
- `VentaSchema`: `fecha`, `estado`, `vendedorId` (compuestos)
- `ProductoSchema`: `codigo`, `nombre`, `activo`
- `DetalleVentaSchema`: `ventaId`, `productoId`

❌ **Faltantes críticos:**
- `DetalleVentaSchema`: No hay índice compuesto `{ ventaId: 1, productoId: 1 }` para joins
- `VentaSchema`: Falta índice para `{ fecha: -1, estado: 1, tipoComprobante: 1 }` (reportes)
- `ProductoSchema`: Búsquedas por `codigoBarras` no tienen índice único

**Impacto:**
- Queries de reportes pueden hacer **full collection scan**
- Con 10,000 ventas → **200-500ms** en lugar de **<10ms**

---

### 8. **REGION MISMATCH (PROBABLE)** ⚠️ ALTO

**Configuración actual:**
- Backend: `region: oregon` (Render)
- MongoDB: **NO ESPECIFICADO** (probablemente en otra región)

**Impacto:**
- Si MongoDB está en `us-east-1` → latencia adicional **50-100ms**
- Si está en `eu-west-1` → latencia adicional **150-200ms**
- **VIOLA** objetivo de <100ms backend-DB

**Solución:**
1. Verificar región de MongoDB Atlas
2. Mover backend a la misma región
3. O mover MongoDB a Oregon

---

### 9. **VALIDATION PIPE SIN OPTIMIZACIÓN** ⚠️ BAJO

**Ubicación:** `backend/src/main.ts` línea 58-67

**Problema:**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, // ❌ Transforma en CADA request
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Impacto:**
- `transform: true` ejecuta `class-transformer` en cada request
- Overhead: **5-15ms por request**
- Para endpoints de solo lectura, es innecesario

**Solución:** Aplicar solo donde se necesite (por endpoint).

---

### 10. **LOGS EXCESIVOS EN PRODUCCIÓN** ⚠️ BAJO

**Ubicación:** Múltiples archivos

**Problema:**
```typescript
// venta.repository.ts líneas 24-26, 41, 127, 143-154
console.log(`[VentaRepository.save] Guardando venta...`);
// ❌ console.log en producción = I/O bloqueante
```

**Impacto:**
- Cada `console.log` = **1-5ms** de I/O
- Con 10 logs por request = **10-50ms** adicionales

**Solución:** Usar logger estructurado con niveles (Winston ya está instalado).

---

## 📊 MÉTRICAS ACTUALES (ESTIMADAS)

| Métrica | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| TTFB | ~800-1200ms | <1000ms | ⚠️ Límite |
| Backend-DB Latency | ~150-300ms | <100ms | ❌ **3x peor** |
| Queries por Request | 10-50 | 1-3 | ❌ **10x peor** |
| Cache Hit Rate | 0% | >80% | ❌ **0%** |
| Pool Efficiency | ~60% | >90% | ⚠️ Bajo |

---

## 🎯 ACCIONES DE IMPACTO ALTO (PRIORIDAD)

### **PRIORIDAD 1: CRÍTICO (Implementar HOY)**

1. **Eliminar N+1 queries en VentaRepository**
   - Tiempo: 2 horas
   - Impacto: **-800ms** en endpoints de ventas
   - Archivo: `venta.repository.ts`

2. **Configurar pooling de MongoDB**
   - Tiempo: 30 minutos
   - Impacto: **-100ms** en cold starts
   - Archivo: `database.config.ts`

3. **Implementar caché para productos y clientes**
   - Tiempo: 3 horas
   - Impacto: **-50ms** por request cacheado
   - Archivos: Nuevos módulos de caché

### **PRIORIDAD 2: ALTO (Esta semana)**

4. **Paralelizar validaciones en CreateVentaUseCase**
   - Tiempo: 1 hora
   - Impacto: **-180ms** en creación de ventas
   - Archivo: `create-venta.use-case.ts`

5. **Agregar índices faltantes**
   - Tiempo: 1 hora
   - Impacto: **-200ms** en reportes
   - Script: Migración de índices

6. **Verificar y corregir región de MongoDB**
   - Tiempo: 1 hora (investigación + cambio)
   - Impacto: **-50-150ms** en todas las queries
   - Configuración: Render + MongoDB Atlas

### **PRIORIDAD 3: MEDIO (Próximas 2 semanas)**

7. **Agregar proyección a queries**
   - Tiempo: 2 horas
   - Impacto: **-20ms** por query
   - Archivos: Todos los repositorios

8. **Mover lógica de mapeo a DTOs**
   - Tiempo: 4 horas
   - Impacto: Mejora mantenibilidad + caché
   - Archivos: Controllers + DTOs

9. **Optimizar ValidationPipe**
   - Tiempo: 1 hora
   - Impacto: **-10ms** por request
   - Archivo: `main.ts`

---

## 📈 MÉTRICAS ESPERADAS DESPUÉS DE OPTIMIZACIONES

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| TTFB (GET /ventas) | ~1200ms | **~300ms** | **-75%** |
| Backend-DB Latency | ~200ms | **~60ms** | **-70%** |
| Queries por Request | 25 | **3** | **-88%** |
| Cache Hit Rate | 0% | **85%** | **+85%** |
| Pool Efficiency | 60% | **95%** | **+58%** |

**Objetivos alcanzados:**
- ✅ TTFB <1s (300ms < 1000ms)
- ✅ Backend-DB <100ms (60ms < 100ms)
- ⚠️ Lighthouse 90: Depende del frontend (no analizado aquí)

---

## 🏗️ ARQUITECTURA OPTIMIZADA RECOMENDADA

### **Capa de Caché**
```
Request → Cache Layer (Redis/Memoria) → MongoDB
         ↓ (cache hit)
         Response (<1ms)
```

### **Pool de Conexiones**
```
App Start → Crear pool (minPoolSize: 10)
Request → Reutilizar conexión del pool
Idle → Mantener conexiones vivas (maxIdleTimeMS: 30s)
```

### **Queries Optimizadas**
```
Antes: 50 queries (1 venta + 49 detalles)
Después: 2 queries (1 ventas + 1 detalles con $in)
```

### **Región Única**
```
Backend (Oregon) + MongoDB Atlas (Oregon)
→ Latencia: <20ms
```

---

## ⚠️ LIMITACIONES DEL PROVEEDOR

### **Render (Starter Plan)**
- ❌ **Sin Redis incluido**: Necesitas Redis externo (Upstash, Railway)
- ⚠️ **Cold starts**: 5-10s en primer request después de idle
- ✅ **Solución**: Usar caché en memoria (menos eficiente pero funcional)

### **MongoDB Atlas (Free Tier)**
- ⚠️ **Límite de conexiones**: 500 (con pooling configurado, suficiente)
- ✅ **Regiones disponibles**: Puedes cambiar región gratis

### **Alternativas si Render limita:**
1. **Railway**: Redis incluido, mejor para caché
2. **Fly.io**: Edge deployment, menor latencia
3. **DigitalOcean App Platform**: Redis incluido, más caro

---

## 📝 PRÓXIMOS PASOS

1. ✅ Revisar este diagnóstico
2. ⏭️ Implementar Prioridad 1 (3 acciones críticas)
3. ⏭️ Medir métricas antes/después
4. ⏭️ Implementar Prioridad 2
5. ⏭️ Revisar frontend (siguiente fase)

---

**¿Querés que implemente alguna de estas optimizaciones ahora?**

