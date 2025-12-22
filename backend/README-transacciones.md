# Requisito: MongoDB Replica Set (Transacciones)

Este backend **requiere MongoDB configurado como Replica Set** para ejecutar transacciones (`session.withTransaction()`).

## ¿Por qué?
- La creación/cancelación de ventas, emisión de comprobantes fiscales y operaciones de caja se ejecutan de forma **atómica**.
- Si Mongo no es replica set, MongoDB lanza el error:  
  `Transaction numbers are only allowed on a replica set member`.

## Configuración rápida (single-node replica set)
### Opción recomendada (Docker Compose)
En la raíz del repo existe `docker-compose.mongo-rs.yml`.

1) Levantar MongoDB (replica set single-node):
- `docker compose -f docker-compose.mongo-rs.yml up -d`

2) Verificar que está OK:
- `docker exec ventas-mongo-rs mongosh --quiet --eval "rs.status().ok"`
  - Debe devolver `1`.

3) Backend: configurar la URI (Windows PowerShell):
- `$env:MONGODB_URI="mongodb://localhost:27017/ventas-ferreteria?replicaSet=rs0"`

### Nota importante: conflicto de puertos (27017)
Si ya tenías otro contenedor Mongo publicando `27017` (por ejemplo `ventas-mongodb-dev`), el replica set puede quedar **sin publicar** el puerto al host.

Solución (ejemplo):
- `docker stop ventas-mongodb-dev`
- `docker rm ventas-mongodb-dev`
- `docker compose -f docker-compose.mongo-rs.yml up -d --force-recreate`

Una vez que Mongo esté en replica set, reiniciá el backend.



