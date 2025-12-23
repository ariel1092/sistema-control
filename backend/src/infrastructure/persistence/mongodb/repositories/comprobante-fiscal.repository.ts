import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IComprobanteFiscalRepository } from '../../../../application/ports/comprobante-fiscal.repository.interface';
import { ComprobanteFiscal } from '../../../../domain/entities/comprobante-fiscal.entity';
import { ComprobanteFiscalMongo, ComprobanteFiscalDocument } from '../schemas/comprobante-fiscal.schema';
import { ComprobanteFiscalMapper } from '../mappers/comprobante-fiscal.mapper';

@Injectable()
export class ComprobanteFiscalRepository implements IComprobanteFiscalRepository {
  constructor(
    @InjectModel(ComprobanteFiscalMongo.name)
    private readonly model: Model<ComprobanteFiscalDocument>,
  ) {}

  async save(comprobante: ComprobanteFiscal, options?: { session?: any }): Promise<ComprobanteFiscal> {
    const session = options?.session;
    const doc = ComprobanteFiscalMapper.toPersistence(comprobante);

    if (comprobante.id) {
      const updated = await this.model
        .findByIdAndUpdate(comprobante.id, doc, { new: true, session })
        .exec();
      return ComprobanteFiscalMapper.toDomain(updated);
    }

    const [created] = await this.model.create([doc], { session });
    return ComprobanteFiscalMapper.toDomain(created);
  }

  async findById(id: string): Promise<ComprobanteFiscal | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? ComprobanteFiscalMapper.toDomain(doc) : null;
  }

  async findByVentaId(ventaId: string): Promise<ComprobanteFiscal | null> {
    const doc = await this.model
      .findOne({ ventaId })
      .sort({ createdAt: -1 })
      .exec();
    return doc ? ComprobanteFiscalMapper.toDomain(doc) : null;
  }
}






