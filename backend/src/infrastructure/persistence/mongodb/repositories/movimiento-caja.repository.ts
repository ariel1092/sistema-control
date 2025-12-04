import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async save(movimiento: MovimientoCaja): Promise<MovimientoCaja> {
    const movimientoDoc = MovimientoCajaMapper.toPersistence(movimiento);

    if (movimiento.id) {
      const updated = await this.movimientoCajaModel
        .findByIdAndUpdate(movimiento.id, movimientoDoc, { new: true })
        .exec();
      return MovimientoCajaMapper.toDomain(updated);
    } else {
      const created = await this.movimientoCajaModel.create(movimientoDoc);
      return MovimientoCajaMapper.toDomain(created);
    }
  }

  async findByCierreCajaId(cierreCajaId: string): Promise<MovimientoCaja[]> {
    const movimientosDocs = await this.movimientoCajaModel
      .find({ cierreCajaId })
      .sort({ createdAt: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCajaMapper.toDomain(doc));
  }

  async findById(id: string): Promise<MovimientoCaja | null> {
    const movimientoDoc = await this.movimientoCajaModel.findById(id).exec();
    return movimientoDoc ? MovimientoCajaMapper.toDomain(movimientoDoc) : null;
  }
}

