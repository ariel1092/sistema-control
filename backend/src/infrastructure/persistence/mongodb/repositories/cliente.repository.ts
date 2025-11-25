import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IClienteRepository } from '../../../../application/ports/cliente.repository.interface';
import { Cliente } from '../../../../domain/entities/cliente.entity';
import { ClienteMongo, ClienteDocument } from '../schemas/cliente.schema';
import { ClienteMapper } from '../mappers/cliente.mapper';

@Injectable()
export class ClienteRepository implements IClienteRepository {
  constructor(
    @InjectModel(ClienteMongo.name)
    private clienteModel: Model<ClienteDocument>,
  ) {}

  async save(cliente: Cliente): Promise<Cliente> {
    const clienteDoc = ClienteMapper.toPersistence(cliente);

    if (cliente.id) {
      const updated = await this.clienteModel
        .findByIdAndUpdate(cliente.id, clienteDoc, { new: true })
        .exec();
      return ClienteMapper.toDomain(updated);
    } else {
      const created = await this.clienteModel.create(clienteDoc);
      return ClienteMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<Cliente | null> {
    const clienteDoc = await this.clienteModel.findById(id).exec();
    return clienteDoc ? ClienteMapper.toDomain(clienteDoc) : null;
  }

  async findByDNI(dni: string): Promise<Cliente | null> {
    const clienteDoc = await this.clienteModel.findOne({ dni }).exec();
    return clienteDoc ? ClienteMapper.toDomain(clienteDoc) : null;
  }

  async findAll(): Promise<Cliente[]> {
    const clientesDocs = await this.clienteModel.find().sort({ nombre: 1 }).exec();
    return clientesDocs.map((doc) => ClienteMapper.toDomain(doc));
  }

  async search(termino: string): Promise<Cliente[]> {
    const clientesDocs = await this.clienteModel
      .find({
        $or: [
          { nombre: { $regex: termino, $options: 'i' } },
          { razonSocial: { $regex: termino, $options: 'i' } },
          { dni: { $regex: termino, $options: 'i' } },
        ],
      })
      .sort({ nombre: 1 })
      .exec();
    return clientesDocs.map((doc) => ClienteMapper.toDomain(doc));
  }

  async update(cliente: Cliente): Promise<Cliente> {
    return this.save(cliente);
  }

  async delete(id: string): Promise<void> {
    await this.clienteModel.findByIdAndDelete(id).exec();
  }
}




