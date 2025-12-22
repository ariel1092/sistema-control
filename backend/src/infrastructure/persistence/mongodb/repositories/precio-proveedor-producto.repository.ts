import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  IPrecioProveedorProductoRepository,
  PrecioProveedorProductoHistoricoItem,
  PrecioProveedorProductoVigenteItem,
} from '../../../../application/ports/precio-proveedor-producto.repository.interface';
import { PrecioProveedorProductoMongo, PrecioProveedorProductoDocument } from '../schemas/precio-proveedor-producto.schema';

@Injectable()
export class PrecioProveedorProductoRepository implements IPrecioProveedorProductoRepository {
  constructor(
    @InjectModel(PrecioProveedorProductoMongo.name)
    private readonly model: Model<PrecioProveedorProductoDocument>,
  ) {}

  async findVigentesByProducto(productoId: string): Promise<PrecioProveedorProductoVigenteItem[]> {
    const productoIdQuery = Types.ObjectId.isValid(productoId)
      ? new Types.ObjectId(productoId)
      : (productoId as any);

    const rows = await this.model.aggregate([
      { $match: { productoId: productoIdQuery, activo: true } },
      // Ordenar por fecha desc para luego quedarnos con el "último" precio por proveedor
      { $sort: { fecha: -1 } },
      // Agrupar por proveedorId y quedarnos con el primero (más reciente por el sort previo)
      {
        $group: {
          _id: '$proveedorId',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
      {
        $lookup: {
          from: 'proveedores',
          localField: 'proveedorId',
          foreignField: '_id',
          as: 'proveedor',
        },
      },
      { $unwind: { path: '$proveedor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          productoId: 1,
          proveedorId: 1,
          proveedorNombre: { $ifNull: ['$proveedor.nombre', ''] },
          precioUnitario: 1,
          descuentoPct: 1,
          ivaPct: 1,
          moneda: 1,
          fecha: 1,
          fuente: 1,
        },
      },
    ]).exec();

    return (rows || []).map((r: any) => ({
      id: r._id?.toString?.() ?? String(r._id),
      productoId: r.productoId?.toString?.() ?? String(r.productoId),
      proveedorId: r.proveedorId?.toString?.() ?? String(r.proveedorId),
      proveedorNombre: r.proveedorNombre || '',
      precioUnitario: r.precioUnitario,
      descuentoPct: r.descuentoPct ?? 0,
      ivaPct: r.ivaPct ?? 0,
      moneda: r.moneda,
      fecha: r.fecha,
      fuente: r.fuente,
    }));
  }

  async findHistorico(productoId: string, proveedorId: string): Promise<PrecioProveedorProductoHistoricoItem[]> {
    const productoIdQuery = Types.ObjectId.isValid(productoId)
      ? new Types.ObjectId(productoId)
      : (productoId as any);
    const proveedorIdQuery = Types.ObjectId.isValid(proveedorId)
      ? new Types.ObjectId(proveedorId)
      : (proveedorId as any);

    const docs = await this.model
      .find({ productoId: productoIdQuery, proveedorId: proveedorIdQuery })
      .sort({ fecha: -1 })
      .select({
        productoId: 1,
        proveedorId: 1,
        precioUnitario: 1,
        descuentoPct: 1,
        ivaPct: 1,
        moneda: 1,
        fecha: 1,
        fuente: 1,
        activo: 1,
        referenciaTipo: 1,
        referenciaId: 1,
        codigoProducto: 1,
        nombreProducto: 1,
        observaciones: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean()
      .exec();

    return (docs || []).map((d: any) => ({
      id: d._id?.toString?.() ?? String(d._id),
      productoId: d.productoId?.toString?.() ?? String(d.productoId),
      proveedorId: d.proveedorId?.toString?.() ?? String(d.proveedorId),
      precioUnitario: d.precioUnitario,
      descuentoPct: d.descuentoPct ?? 0,
      ivaPct: d.ivaPct ?? 0,
      moneda: d.moneda,
      fecha: d.fecha,
      fuente: d.fuente,
      activo: d.activo ?? false,
      referenciaTipo: d.referenciaTipo,
      referenciaId: d.referenciaId,
      codigoProducto: d.codigoProducto,
      nombreProducto: d.nombreProducto,
      observaciones: d.observaciones,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }
}


