import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IProductoRepository } from '../../../../application/ports/producto.repository.interface';
import { Producto } from '../../../../domain/entities/producto.entity';
import { ProductoMongo, ProductoDocument } from '../schemas/producto.schema';
import { ProductoMapper } from '../mappers/producto.mapper';

@Injectable()
export class ProductoRepository implements IProductoRepository {
  constructor(
    @InjectModel(ProductoMongo.name)
    private productoModel: Model<ProductoDocument>,
  ) { }

  async save(producto: Producto, options?: { session?: any }): Promise<Producto> {
    const productoDoc = ProductoMapper.toPersistence(producto);
    const session = options?.session;

    if (producto.id) {
      const updated = await this.productoModel
        .findByIdAndUpdate(producto.id, productoDoc, { new: true, session })
        .exec();
      return ProductoMapper.toDomain(updated);
    } else {
      const [created] = await this.productoModel.create([productoDoc], { session });
      return ProductoMapper.toDomain(created);
    }
  }

  async findById(id: string, options?: { session?: any }): Promise<Producto | null> {
    if (!id || !Types.ObjectId.isValid(id)) {
      return null;
    }
    const session = options?.session;
    const productoDoc = await this.productoModel.findById(id, null, { session }).exec();
    return productoDoc ? ProductoMapper.toDomain(productoDoc) : null;
  }

  async findByCodigo(codigo: string): Promise<Producto | null> {
    const productoDoc = await this.productoModel.findOne({ codigo }).exec();
    return productoDoc ? ProductoMapper.toDomain(productoDoc) : null;
  }

  async findByCodigos(codigos: string[], options?: { session?: any }): Promise<Producto[]> {
    if (!codigos || codigos.length === 0) return [];
    const session = options?.session;
    const docs = await this.productoModel
      .find({ codigo: { $in: codigos } }, null, { session })
      .exec();
    return docs.map((d) => ProductoMapper.toDomain(d));
  }

  async search(termino: string, limit: number = 50, skip: number = 0): Promise<{ data: Producto[], total: number }> {
    const filter = {
      $or: [
        { nombre: { $regex: termino, $options: 'i' } },
        { descripcion: { $regex: termino, $options: 'i' } },
        { codigo: { $regex: termino, $options: 'i' } },
      ],
    };

    const [total, docs] = await Promise.all([
      this.productoModel.countDocuments(filter).exec(),
      this.productoModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    return {
      data: docs.map((doc) => ProductoMapper.toDomain(doc)),
      total,
    };
  }

  async findByCategoria(categoria: string): Promise<Producto[]> {
    const productosDocs = await this.productoModel
      .find({ categoria })
      .exec();

    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }

  async findAll(activos?: boolean, limit: number = 0, skip: number = 0): Promise<{ data: Producto[], total: number }> {
    const query: any = {};
    if (activos !== undefined) {
      query.activo = activos;
    }

    const countQuery = this.productoModel.countDocuments(query).exec();
    let findQuery = this.productoModel.find(query);

    if (limit > 0) {
      findQuery = findQuery.skip(skip).limit(limit);
    }

    const [total, docs] = await Promise.all([countQuery, findQuery.exec()]);

    return {
      data: docs.map((doc) => ProductoMapper.toDomain(doc)),
      total,
    };
  }

  async update(producto: Producto): Promise<Producto> {
    return this.save(producto);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: marcar como inactivo
    await this.productoModel
      .findByIdAndUpdate(id, { activo: false })
      .exec();
  }

  async findByIds(ids: string[], options?: { session?: any }): Promise<Producto[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const session = options?.session;
    const productosDocs = await this.productoModel
      .find({ _id: { $in: objectIds } }, null, { session })
      .exec();

    return productosDocs.map((doc) => ProductoMapper.toDomain(doc));
  }

  async bulkDescontarStock(
    items: Array<{ productoId: string; cantidad: number }>,
    options?: { session?: any },
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const session = options?.session;

    const ops = items.map((it) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(it.productoId),
          activo: true,
          // Guardrail de consistencia: evitar stock negativo bajo concurrencia.
          stockActual: { $gte: it.cantidad },
        },
        update: { $inc: { stockActual: -it.cantidad } },
      },
    }));

    const res = await this.productoModel.bulkWrite(ops as any, { session });

    // Si algún update no matchea (p.ej. stock insuficiente o producto inactivo), respetar el comportamiento:
    // falla la operación y la transacción hace rollback.
    if ((res as any)?.modifiedCount !== ops.length) {
      throw new Error(
        `No se pudo descontar stock para todos los productos (actualizados ${(res as any)?.modifiedCount ?? 0}/${ops.length}).`,
      );
    }
  }

  async bulkUpsertByCodigo(
    productos: Producto[],
    options?: { session?: any },
  ): Promise<void> {
    if (!productos || productos.length === 0) return;
    const session = options?.session;
    const now = new Date();

    // Procesar en chunks para no generar un bulk gigantesco
    const chunkSize = 500;
    for (let i = 0; i < productos.length; i += chunkSize) {
      const chunk = productos.slice(i, i + chunkSize);

      const ops = chunk.map((p) => {
        const doc = ProductoMapper.toPersistence(p);
        // Nunca setear _id en updates
        delete (doc as any)._id;
        return {
          updateOne: {
            filter: { codigo: p.codigo },
            update: {
              $set: {
                ...doc,
                // BulkWrite no garantiza timestamps automáticos: seteamos updatedAt manualmente
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            upsert: true,
          },
        };
      });

      await this.productoModel.bulkWrite(ops as any, { session });
    }
  }
}

