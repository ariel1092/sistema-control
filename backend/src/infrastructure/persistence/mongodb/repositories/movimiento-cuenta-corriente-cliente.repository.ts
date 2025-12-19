import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../../../application/ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { MovimientoCuentaCorrienteCliente } from '../../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { MovimientoCuentaCorrienteClienteMongo, MovimientoCuentaCorrienteClienteDocument } from '../schemas/movimiento-cuenta-corriente-cliente.schema';
import { MovimientoCuentaCorrienteClienteMapper } from '../mappers/movimiento-cuenta-corriente-cliente.mapper';

@Injectable()
export class MovimientoCuentaCorrienteClienteRepository implements IMovimientoCuentaCorrienteClienteRepository {
  constructor(
    @InjectModel(MovimientoCuentaCorrienteClienteMongo.name)
    private movimientoModel: Model<MovimientoCuentaCorrienteClienteDocument>,
  ) { }

  async save(movimiento: MovimientoCuentaCorrienteCliente, options?: { session?: any }): Promise<MovimientoCuentaCorrienteCliente> {
    const movimientoDoc = MovimientoCuentaCorrienteClienteMapper.toPersistence(movimiento);
    const session = options?.session;

    if (movimiento.id) {
      const updated = await this.movimientoModel
        .findByIdAndUpdate(movimiento.id, movimientoDoc, { new: true, session })
        .exec();
      return MovimientoCuentaCorrienteClienteMapper.toDomain(updated);
    } else {
      const [created] = await this.movimientoModel.create([movimientoDoc], { session });
      return MovimientoCuentaCorrienteClienteMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<MovimientoCuentaCorrienteCliente | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const movimientoDoc = await this.movimientoModel.findById(id).exec();
    return movimientoDoc ? MovimientoCuentaCorrienteClienteMapper.toDomain(movimientoDoc) : null;
  }

  async findByCliente(clienteId: string): Promise<MovimientoCuentaCorrienteCliente[]> {
    const movimientosDocs = await this.movimientoModel
      .find({ clienteId: new Types.ObjectId(clienteId) })
      .sort({ fecha: -1, createdAt: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCuentaCorrienteClienteMapper.toDomain(doc));
  }

  async findByDocumentoId(documentoId: string): Promise<MovimientoCuentaCorrienteCliente[]> {
    const movimientosDocs = await this.movimientoModel
      .find({ documentoId: documentoId })
      .sort({ fecha: -1, createdAt: -1 })
      .exec();

    return movimientosDocs.map((doc) => MovimientoCuentaCorrienteClienteMapper.toDomain(doc));
  }

  async getUltimoSaldo(clienteId: string): Promise<number> {
    const ultimoMovimiento = await this.movimientoModel
      .findOne({ clienteId: new Types.ObjectId(clienteId) })
      .sort({ fecha: -1, createdAt: -1 })
      .exec();

    return ultimoMovimiento ? ultimoMovimiento.saldoActual : 0;
  }

  async findAll(): Promise<MovimientoCuentaCorrienteCliente[]> {
    const movimientosDocs = await this.movimientoModel.find().sort({ fecha: -1, createdAt: -1 }).exec();
    return movimientosDocs.map((doc) => MovimientoCuentaCorrienteClienteMapper.toDomain(doc));
  }
}


