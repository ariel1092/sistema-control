import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IAuditoriaEventoRepository } from '../../../../application/ports/auditoria-evento.repository.interface';
import { AuditoriaEvento } from '../../../../domain/entities/auditoria-evento.entity';
import { AuditoriaEventoMongo, AuditoriaEventoDocument } from '../schemas/auditoria-evento.schema';
import { AuditoriaEventoMapper } from '../mappers/auditoria-evento.mapper';

@Injectable()
export class AuditoriaEventoRepository implements IAuditoriaEventoRepository {
  constructor(
    @InjectModel(AuditoriaEventoMongo.name)
    private auditoriaModel: Model<AuditoriaEventoDocument>,
  ) { }

  async save(evento: AuditoriaEvento, options?: { session?: any }): Promise<AuditoriaEvento> {
    const doc = AuditoriaEventoMapper.toPersistence(evento);
    const session = options?.session;

    if (evento.id && Types.ObjectId.isValid(evento.id)) {
      const updated = await this.auditoriaModel
        .findByIdAndUpdate(evento.id, doc, { new: true })
        .exec();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return AuditoriaEventoMapper.toDomain(updated!);
    }

    const [created] = await this.auditoriaModel.create([doc], { session });
    return AuditoriaEventoMapper.toDomain(created);
  }

  async findByEntidad(entidad: string, entidadId: string): Promise<AuditoriaEvento[]> {
    const docs = await this.auditoriaModel
      .find({ entidad, entidadId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => AuditoriaEventoMapper.toDomain(d));
  }
}


