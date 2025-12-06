import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IFacturaClienteRepository } from '../../../../application/ports/factura-cliente.repository.interface';
import { FacturaCliente } from '../../../../domain/entities/factura-cliente.entity';
import { FacturaClienteMongo, FacturaClienteDocument } from '../schemas/factura-cliente.schema';
import { FacturaClienteMapper } from '../mappers/factura-cliente.mapper';

@Injectable()
export class FacturaClienteRepository implements IFacturaClienteRepository {
  constructor(
    @InjectModel(FacturaClienteMongo.name)
    private facturaModel: Model<FacturaClienteDocument>,
  ) {}

  async save(factura: FacturaCliente): Promise<FacturaCliente> {
    const facturaDoc = FacturaClienteMapper.toPersistence(factura);

    let facturaGuardada;
    if (factura.id) {
      facturaGuardada = await this.facturaModel
        .findByIdAndUpdate(factura.id, facturaDoc, { new: true })
        .exec();
    } else {
      facturaGuardada = await this.facturaModel.create(facturaDoc);
    }

    return FacturaClienteMapper.toDomain(facturaGuardada);
  }

  async findById(id: string): Promise<FacturaCliente | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const facturaDoc = await this.facturaModel.findById(id).exec();
    if (!facturaDoc) return null;

    return FacturaClienteMapper.toDomain(facturaDoc);
  }

  async findByCliente(clienteId: string): Promise<FacturaCliente[]> {
    const facturasDocs = await this.facturaModel
      .find({ clienteId: new Types.ObjectId(clienteId) })
      .sort({ fecha: -1 })
      .exec();

    return facturasDocs.map((doc) => FacturaClienteMapper.toDomain(doc));
  }

  async findPendientes(clienteId?: string): Promise<FacturaCliente[]> {
    const query: any = { pagada: false };
    if (clienteId) {
      query.clienteId = new Types.ObjectId(clienteId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    return facturasDocs.map((doc) => FacturaClienteMapper.toDomain(doc));
  }

  async findPorVencer(dias: number, clienteId?: string): Promise<FacturaCliente[]> {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    const query: any = {
      pagada: false,
      fechaVencimiento: {
        $gte: hoy,
        $lte: fechaLimite,
      },
    };

    if (clienteId) {
      query.clienteId = new Types.ObjectId(clienteId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    return facturasDocs.map((doc) => FacturaClienteMapper.toDomain(doc));
  }

  async findVencidas(clienteId?: string): Promise<FacturaCliente[]> {
    const hoy = new Date();
    const query: any = {
      pagada: false,
      fechaVencimiento: { $lt: hoy },
    };

    if (clienteId) {
      query.clienteId = new Types.ObjectId(clienteId);
    }

    const facturasDocs = await this.facturaModel
      .find(query)
      .sort({ fechaVencimiento: 1 })
      .exec();

    return facturasDocs.map((doc) => FacturaClienteMapper.toDomain(doc));
  }

  async findAll(): Promise<FacturaCliente[]> {
    const facturasDocs = await this.facturaModel.find().sort({ fecha: -1 }).exec();
    return facturasDocs.map((doc) => FacturaClienteMapper.toDomain(doc));
  }
}


