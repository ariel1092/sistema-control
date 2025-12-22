import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMovimientoCajaRepository } from '../../../../application/ports/movimiento-caja.repository.interface';
import { MovimientoCaja } from '../../../../domain/entities/movimiento-caja.entity';
import { MovimientoCajaMongo, MovimientoCajaDocument } from '../schemas/movimiento-caja.schema';
import { MovimientoCajaMapper } from '../mappers/movimiento-caja.mapper';

@Injectable()
export class MovimientoCajaRepository implements IMovimientoCajaRepository {
  constructor(
    @InjectModel(MovimientoCajaMongo.name)
    private movimientoCajaModel: Model<MovimientoCajaDocument>,
  ) {}

  async save(movimiento: MovimientoCaja, options?: { session?: any }): Promise<MovimientoCaja> {
    const session = options?.session;
    const movimientoDoc = MovimientoCajaMapper.toPersistence(movimiento);

    if (movimiento.id) {
      const updated = await this.movimientoCajaModel
        .findByIdAndUpdate(movimiento.id, movimientoDoc, { new: true, session })
        .exec();
      return MovimientoCajaMapper.toDomain(updated);
    } else {
      const [created] = await this.movimientoCajaModel.create([movimientoDoc], { session });
      return MovimientoCajaMapper.toDomain(created);
    }
  }

  async saveMany(movimientos: MovimientoCaja[], options?: { session?: any }): Promise<MovimientoCaja[]> {
    const session = options?.session;
    if (!movimientos || movimientos.length === 0) return [];
    const docs = movimientos.map((m) => MovimientoCajaMapper.toPersistence(m));
    const created = await this.movimientoCajaModel.insertMany(docs, { session });
    return created.map((d) => MovimientoCajaMapper.toDomain(d));
  }

  async findByCierreCajaId(cierreCajaId: string): Promise<MovimientoCaja[]> {
    const cierreCajaIdQuery = Types.ObjectId.isValid(cierreCajaId)
      ? new Types.ObjectId(cierreCajaId)
      : (cierreCajaId as any);

    const movimientosDocs = await this.movimientoCajaModel
      .find({ cierreCajaId: cierreCajaIdQuery })
      .sort({ createdAt: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCajaMapper.toDomain(doc));
  }

  async findByVentaId(ventaId: string): Promise<MovimientoCaja[]> {
    const movimientosDocs = await this.movimientoCajaModel
      .find({ ventaId })
      .sort({ createdAt: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCajaMapper.toDomain(doc));
  }

  async findById(id: string): Promise<MovimientoCaja | null> {
    const movimientoDoc = await this.movimientoCajaModel.findById(id).exec();
    return movimientoDoc ? MovimientoCajaMapper.toDomain(movimientoDoc) : null;
  }
}

