import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IConfiguracionRecargosRepository } from '../../../../application/ports/configuracion-recargos.repository.interface';
import { ConfiguracionRecargos } from '../../../../domain/entities/configuracion-recargos.entity';
import { ConfiguracionRecargosMongo, ConfiguracionRecargosDocument } from '../schemas/configuracion-recargos.schema';
import { ConfiguracionRecargosMapper } from '../mappers/configuracion-recargos.mapper';

@Injectable()
export class ConfiguracionRecargosRepository implements IConfiguracionRecargosRepository {
  constructor(
    @InjectModel(ConfiguracionRecargosMongo.name)
    private readonly model: Model<ConfiguracionRecargosDocument>,
  ) {}

  async get(): Promise<ConfiguracionRecargos> {
    const doc = await this.model
      .findOneAndUpdate(
        { key: 'RECARGOS' },
        { $setOnInsert: { key: 'RECARGOS', recargoDebitoPct: 0, recargoCreditoPct: 0 } },
        { upsert: true, new: true },
      )
      .exec();
    return ConfiguracionRecargosMapper.toDomain(doc);
  }

  async update(params: { recargoDebitoPct: number; recargoCreditoPct: number; updatedBy?: string }): Promise<ConfiguracionRecargos> {
    const updateDoc = ConfiguracionRecargosMapper.toPersistence(params);
    const doc = await this.model
      .findOneAndUpdate(
        { key: 'RECARGOS' },
        { $set: updateDoc, $setOnInsert: { key: 'RECARGOS' } },
        { upsert: true, new: true },
      )
      .exec();
    return ConfiguracionRecargosMapper.toDomain(doc);
  }
}


