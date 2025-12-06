import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IRetiroSocioRepository } from '../../../../application/ports/retiro-socio.repository.interface';
import { RetiroSocio } from '../../../../domain/entities/retiro-socio.entity';
import { CuentaBancaria } from '../../../../domain/enums/cuenta-bancaria.enum';
import { RetiroSocioMongo, RetiroSocioDocument } from '../schemas/retiro-socio.schema';
import { RetiroSocioMapper } from '../mappers/retiro-socio.mapper';

@Injectable()
export class RetiroSocioRepository implements IRetiroSocioRepository {
  constructor(
    @InjectModel(RetiroSocioMongo.name)
    private retiroModel: Model<RetiroSocioDocument>,
  ) {}

  async save(retiro: RetiroSocio): Promise<RetiroSocio> {
    const retiroDoc = RetiroSocioMapper.toPersistence(retiro);

    if (retiro.id) {
      const updated = await this.retiroModel
        .findByIdAndUpdate(retiro.id, retiroDoc, { new: true })
        .exec();
      return RetiroSocioMapper.toDomain(updated);
    } else {
      const created = await this.retiroModel.create(retiroDoc);
      return RetiroSocioMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<RetiroSocio | null> {
    const retiroDoc = await this.retiroModel.findById(id).exec();
    return retiroDoc ? RetiroSocioMapper.toDomain(retiroDoc) : null;
  }

  async findAll(cuentaBancaria?: CuentaBancaria, fechaInicio?: Date, fechaFin?: Date): Promise<RetiroSocio[]> {
    const query: any = {};

    if (cuentaBancaria) {
      query.cuentaBancaria = cuentaBancaria;
    }

    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) {
        query.fecha.$gte = fechaInicio;
      }
      if (fechaFin) {
        const fechaFinAjustada = new Date(fechaFin);
        fechaFinAjustada.setHours(23, 59, 59, 999);
        query.fecha.$lte = fechaFinAjustada;
      }
    }

    const retirosDocs = await this.retiroModel.find(query).sort({ fecha: -1 }).exec();
    return retirosDocs.map((doc) => RetiroSocioMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.retiroModel.findByIdAndDelete(id).exec();
  }

  async getTotalRetiros(cuentaBancaria: CuentaBancaria, fechaInicio: Date, fechaFin: Date): Promise<number> {
    const fechaFinAjustada = new Date(fechaFin);
    fechaFinAjustada.setHours(23, 59, 59, 999);

    const resultado = await this.retiroModel.aggregate([
      {
        $match: {
          cuentaBancaria,
          fecha: {
            $gte: fechaInicio,
            $lte: fechaFinAjustada,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' },
        },
      },
    ]);

    return resultado.length > 0 ? resultado[0].total : 0;
  }
}









