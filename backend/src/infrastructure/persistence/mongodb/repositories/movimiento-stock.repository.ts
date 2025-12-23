import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMovimientoStockRepository } from '../../../../application/ports/movimiento-stock.repository.interface';
import { MovimientoStock } from '../../../../domain/entities/movimiento-stock.entity';
import { MovimientoStockMongo, MovimientoStockDocument } from '../schemas/movimiento-stock.schema';
import { MovimientoStockMapper } from '../mappers/movimiento-stock.mapper';
import { TipoMovimientoStock } from '../../../../domain/enums/tipo-movimiento-stock.enum';

@Injectable()
export class MovimientoStockRepository implements IMovimientoStockRepository {
  constructor(
    @InjectModel(MovimientoStockMongo.name)
    private movimientoStockModel: Model<MovimientoStockDocument>,
  ) { }

  async save(movimiento: MovimientoStock, options?: { session?: any }): Promise<MovimientoStock> {
    const movimientoDoc = MovimientoStockMapper.toPersistence(movimiento);
    const session = options?.session;

    if (movimiento.id) {
      const updated = await this.movimientoStockModel
        .findByIdAndUpdate(movimiento.id, movimientoDoc, { new: true, session })
        .exec();
      return MovimientoStockMapper.toDomain(updated);
    } else {
      const [created] = await this.movimientoStockModel.create([movimientoDoc], { session });
      return MovimientoStockMapper.toDomain(created);
    }
  }

  async saveMany(movimientos: MovimientoStock[], options?: { session?: any }): Promise<MovimientoStock[]> {
    const session = options?.session;
    if (!movimientos || movimientos.length === 0) return [];
    const docs = movimientos.map((m) => MovimientoStockMapper.toPersistence(m));
    const created = await this.movimientoStockModel.insertMany(docs, { session });
    return created.map((d) => MovimientoStockMapper.toDomain(d));
  }

  async findById(id: string): Promise<MovimientoStock | null> {
    if (!id || !Types.ObjectId.isValid(id)) {
      return null;
    }
    const movimientoDoc = await this.movimientoStockModel.findById(id).exec();
    return movimientoDoc ? MovimientoStockMapper.toDomain(movimientoDoc) : null;
  }

  async findByProductoId(productoId: string): Promise<MovimientoStock[]> {
    const movimientosDocs = await this.movimientoStockModel
      .find({ productoId: new Types.ObjectId(productoId) })
      .sort({ createdAt: -1 })
      .exec();
    return movimientosDocs.map((doc) => MovimientoStockMapper.toDomain(doc));
  }

  async findByVentaId(ventaId: string): Promise<MovimientoStock[]> {
    const movimientosDocs = await this.movimientoStockModel
      .find({ ventaId: new Types.ObjectId(ventaId) })
      .sort({ createdAt: -1 })
      .exec();
    return movimientosDocs.map((doc) => MovimientoStockMapper.toDomain(doc));
  }

  async findByTipo(tipo: TipoMovimientoStock, fechaInicio?: Date, fechaFin?: Date): Promise<MovimientoStock[]> {
    const query: any = { tipo };

    if (fechaInicio || fechaFin) {
      query.createdAt = {};
      if (fechaInicio) {
        fechaInicio.setHours(0, 0, 0, 0);
        query.createdAt.$gte = fechaInicio;
      }
      if (fechaFin) {
        fechaFin.setHours(23, 59, 59, 999);
        query.createdAt.$lte = fechaFin;
      }
    }

    const movimientosDocs = await this.movimientoStockModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
    return movimientosDocs.map((doc) => MovimientoStockMapper.toDomain(doc));
  }

  async findAll(fechaInicio?: Date, fechaFin?: Date): Promise<MovimientoStock[]> {
    const query: any = {};

    if (fechaInicio || fechaFin) {
      query.createdAt = {};
      if (fechaInicio) {
        fechaInicio.setHours(0, 0, 0, 0);
        query.createdAt.$gte = fechaInicio;
      }
      if (fechaFin) {
        fechaFin.setHours(23, 59, 59, 999);
        query.createdAt.$lte = fechaFin;
      }
    }

    const movimientosDocs = await this.movimientoStockModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
    return movimientosDocs.map((doc) => MovimientoStockMapper.toDomain(doc));
  }

  async hasMovimientos(productoId: string): Promise<boolean> {
    const count = await this.movimientoStockModel
      .countDocuments({ productoId: new Types.ObjectId(productoId) })
      .exec();
    return count > 0;
  }
}
