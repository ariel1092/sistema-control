import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ProductoMongo } from '../src/infrastructure/persistence/mongodb/schemas/producto.schema';
import { ProveedorMongo } from '../src/infrastructure/persistence/mongodb/schemas/proveedor.schema';
import {
  FuentePrecioProveedorProducto,
  MonedaPrecio,
  PrecioProveedorProductoMongo,
} from '../src/infrastructure/persistence/mongodb/schemas/precio-proveedor-producto.schema';

type AnyDoc = any;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const productoModel = app.get<Model<AnyDoc>>(getModelToken(ProductoMongo.name));
  const proveedorModel = app.get<Model<AnyDoc>>(getModelToken(ProveedorMongo.name));
  const precioProvProdModel = app.get<Model<AnyDoc>>(
    getModelToken(PrecioProveedorProductoMongo.name),
  );

  const productoCodigo = 'SEED-COMP-001';
  const productoNombre = 'Producto Seed - Comparación Proveedores';

  console.log('🌱 Seed - comparación de proveedores por producto\n');

  try {
    // 1) Producto
    let producto = await productoModel.findOne({ codigo: productoCodigo }).exec();
    if (!producto) {
      producto = await productoModel.create({
        codigo: productoCodigo,
        nombre: productoNombre,
        categoria: 'General',
        precioVenta: 1500,
        stockActual: 999,
        stockMinimo: 10,
        unidadMedida: 'UN',
        activo: true,
        descuento: 0,
        iva: 21,
      });
      console.log(`✅ Producto creado: ${productoCodigo} (${producto._id})`);
    } else {
      console.log(`ℹ️  Producto existente: ${productoCodigo} (${producto._id})`);
    }

    // 2) Proveedores (create-or-reuse por nombre)
    const proveedoresSeed = [
      { nombre: 'Proveedor Seed A', categoria: 'OTROS' },
      { nombre: 'Proveedor Seed B', categoria: 'OTROS' },
      { nombre: 'Proveedor Seed C', categoria: 'OTROS' },
    ];

    const proveedores: AnyDoc[] = [];
    for (const p of proveedoresSeed) {
      let prov = await proveedorModel.findOne({ nombre: p.nombre }).exec();
      if (!prov) {
        prov = await proveedorModel.create({
          nombre: p.nombre,
          categoria: p.categoria,
          formaPagoHabitual: 'EFECTIVO',
          margenGanancia: 100,
          activo: true,
          observaciones: 'Proveedor creado por seed de comparación',
        });
        console.log(`✅ Proveedor creado: ${prov.nombre} (${prov._id})`);
      } else {
        console.log(`ℹ️  Proveedor existente: ${prov.nombre} (${prov._id})`);
      }
      proveedores.push(prov);
    }

    // 3) Precios (upsert idempotente usando referenciaId; activo=true)
    const ahora = new Date();

    const precios = [
      {
        proveedorNombre: 'Proveedor Seed A',
        precioUnitario: 1000,
        descuentoPct: 0,
        ivaPct: 21,
      },
      {
        proveedorNombre: 'Proveedor Seed B',
        precioUnitario: 1100,
        descuentoPct: 15,
        ivaPct: 21,
      },
      {
        proveedorNombre: 'Proveedor Seed C',
        precioUnitario: 950,
        descuentoPct: 5,
        ivaPct: 21,
      },
    ];

    for (let i = 0; i < precios.length; i++) {
      const item = precios[i];
      const proveedor = proveedores.find((x) => x.nombre === item.proveedorNombre);
      if (!proveedor?._id) continue;

      const referenciaId = `SEED-COMP-PRECIOS:${productoCodigo}:${item.proveedorNombre}:v1`;

      // Fecha distinta por item para que sea más “realista”
      const fecha = new Date(ahora);
      fecha.setMinutes(ahora.getMinutes() - i);

      await precioProvProdModel.updateOne(
        {
          productoId: new Types.ObjectId(producto._id),
          proveedorId: new Types.ObjectId(proveedor._id),
          fuente: FuentePrecioProveedorProducto.MANUAL,
          referenciaId,
        },
        {
          $set: {
            productoId: new Types.ObjectId(producto._id),
            proveedorId: new Types.ObjectId(proveedor._id),
            precioUnitario: item.precioUnitario,
            descuentoPct: item.descuentoPct,
            ivaPct: item.ivaPct,
            moneda: MonedaPrecio.ARS,
            fecha,
            fuente: FuentePrecioProveedorProducto.MANUAL,
            activo: true,
            referenciaTipo: 'SEED',
            referenciaId,
            codigoProducto: productoCodigo,
            nombreProducto: productoNombre,
            observaciones: 'Precio creado por seed para probar comparación',
          },
        },
        { upsert: true },
      );
    }

    console.log('\n✅ Precios vigentes upserteados para comparación.');
    console.log(`\n🧪 Probá en UI buscando el producto por código: ${productoCodigo}`);
    console.log(`   ProductoId: ${producto._id}`);
    console.log(
      `\n🔎 Endpoint: GET /productos/${producto._id}/precios-proveedores`,
    );
  } catch (err: any) {
    console.error('❌ Error en seed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();


