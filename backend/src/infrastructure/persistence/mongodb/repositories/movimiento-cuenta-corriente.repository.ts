import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMovimientoCuentaCorrienteRepository } from '../../../../application/ports/movimiento-cuenta-corriente.repository.interface';
import { MovimientoCuentaCorriente } from '../../../../domain/entities/movimiento-cuenta-corriente.entity';
import { MovimientoCuentaCorrienteMongo, MovimientoCuentaCorrienteDocument } from '../schemas/movimiento-cuenta-corriente.schema';
import { MovimientoCuentaCorrienteMapper } from '../mappers/movimiento-cuenta-corriente.mapper';
import { TipoMovimientoCC } from '../../../../domain/enums/tipo-movimiento-cc.enum';

@Injectable()
export class MovimientoCuentaCorrienteRepository implements IMovimientoCuentaCorrienteRepository {
  constructor(
    @InjectModel(MovimientoCuentaCorrienteMongo.name)
    private movimientoModel: Model<MovimientoCuentaCorrienteDocument>,
  ) {}

  async save(movimiento: MovimientoCuentaCorriente): Promise<MovimientoCuentaCorriente> {
    const movimientoDoc = MovimientoCuentaCorrienteMapper.toPersistence(movimiento);

    if (movimiento.id) {
      const updated = await this.movimientoModel
        .findByIdAndUpdate(movimiento.id, movimientoDoc, { new: true })
        .exec();
      return MovimientoCuentaCorrienteMapper.toDomain(updated);
    } else {
      const created = await this.movimientoModel.create(movimientoDoc);
      return MovimientoCuentaCorrienteMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<MovimientoCuentaCorriente | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const movimientoDoc = await this.movimientoModel.findById(id).exec();
    return movimientoDoc ? MovimientoCuentaCorrienteMapper.toDomain(movimientoDoc) : null;
  }

  async findByProveedor(proveedorId: string): Promise<MovimientoCuentaCorriente[]> {
    const movimientosDocs = await this.movimientoModel
      .find({ proveedorId: new Types.ObjectId(proveedorId) })
      .sort({ fecha: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCuentaCorrienteMapper.toDomain(doc));
  }

  async getUltimoSaldo(proveedorId: string): Promise<number> {
    const ultimoMovimiento = await this.movimientoModel
      .findOne({ proveedorId: new Types.ObjectId(proveedorId) })
      .sort({ fecha: -1 })
      .exec();

    return ultimoMovimiento ? ultimoMovimiento.saldoActual : 0;
  }

  async getDeudaTotal(proveedorId: string): Promise<number> {
    // La deuda total es el saldo actual del último movimiento
    return this.getUltimoSaldo(proveedorId);
  }

  async findAll(): Promise<MovimientoCuentaCorriente[]> {
    const movimientosDocs = await this.movimientoModel.find().sort({ fecha: -1 }).exec();
    return movimientosDocs.map((doc) => MovimientoCuentaCorrienteMapper.toDomain(doc));
  }
}


