import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMovimientoVentaRepository } from '../../../../application/ports/movimiento-venta.repository.interface';
import { MovimientoVenta } from '../../../../domain/entities/movimiento-venta.entity';
import { MovimientoVentaMongo, MovimientoVentaDocument } from '../schemas/movimiento-venta.schema';
import { MovimientoVentaMapper } from '../mappers/movimiento-venta.mapper';
import { TipoEventoVenta } from '../../../../domain/enums/tipo-evento-venta.enum';

@Injectable()
export class MovimientoVentaRepository implements IMovimientoVentaRepository {
  constructor(
    @InjectModel(MovimientoVentaMongo.name)
    private movimientoVentaModel: Model<MovimientoVentaDocument>,
  ) { }

  async save(movimiento: MovimientoVenta, options?: { session?: any }): Promise<MovimientoVenta> {
    const doc = MovimientoVentaMapper.toPersistence(movimiento);
    const session = options?.session;

    if (movimiento.id && Types.ObjectId.isValid(movimiento.id)) {
      const updated = await this.movimientoVentaModel
        .findByIdAndUpdate(movimiento.id, doc, { new: true })
        .exec();
      return MovimientoVentaMapper.toDomain(updated);
    }

    const [created] = await this.movimientoVentaModel.create([doc], { session });
    return MovimientoVentaMapper.toDomain(created);
  }

  async findById(id: string): Promise<MovimientoVenta | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const found = await this.movimientoVentaModel.findById(id).exec();
    return found ? MovimientoVentaMapper.toDomain(found) : null;
  }

  async findByVenta(ventaId: string): Promise<MovimientoVenta[]> {
    if (!Types.ObjectId.isValid(ventaId)) return [];
    const docs = await this.movimientoVentaModel
      .find({ ventaId: new Types.ObjectId(ventaId) })
      .sort({ fecha: -1, createdAt: -1 })
      .exec();
    return docs.map((d) => MovimientoVentaMapper.toDomain(d));
  }

  async findByTipoEvento(tipoEvento: TipoEventoVenta): Promise<MovimientoVenta[]> {
    const docs = await this.movimientoVentaModel
      .find({ tipoEvento })
      .sort({ fecha: -1, createdAt: -1 })
      .exec();
    return docs.map((d) => MovimientoVentaMapper.toDomain(d));
  }
}


