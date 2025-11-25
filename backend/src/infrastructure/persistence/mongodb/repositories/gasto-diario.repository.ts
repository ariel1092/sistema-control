import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGastoDiarioRepository } from '../../../../application/ports/gasto-diario.repository.interface';
import { GastoDiario } from '../../../../domain/entities/gasto-diario.entity';
import { GastoDiarioMongo, GastoDiarioDocument } from '../schemas/gasto-diario.schema';
import { GastoDiarioMapper } from '../mappers/gasto-diario.mapper';

@Injectable()
export class GastoDiarioRepository implements IGastoDiarioRepository {
  constructor(
    @InjectModel(GastoDiarioMongo.name)
    private gastoModel: Model<GastoDiarioDocument>,
  ) {}

  async save(gasto: GastoDiario): Promise<GastoDiario> {
    const gastoDoc = GastoDiarioMapper.toPersistence(gasto);

    if (gasto.id) {
      const updated = await this.gastoModel
        .findByIdAndUpdate(gasto.id, gastoDoc, { new: true })
        .exec();
      return GastoDiarioMapper.toDomain(updated);
    } else {
      const created = await this.gastoModel.create(gastoDoc);
      return GastoDiarioMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<GastoDiario | null> {
    const gastoDoc = await this.gastoModel.findById(id).exec();
    return gastoDoc ? GastoDiarioMapper.toDomain(gastoDoc) : null;
  }

  async findAll(fechaInicio?: Date, fechaFin?: Date, categoria?: string): Promise<GastoDiario[]> {
    const query: any = {};

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

    if (categoria) {
      query.categoria = categoria;
    }

    const gastosDocs = await this.gastoModel.find(query).sort({ fecha: -1 }).exec();
    return gastosDocs.map((doc) => GastoDiarioMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.gastoModel.findByIdAndDelete(id).exec();
  }

  async getTotalPorCategoria(fechaInicio: Date, fechaFin: Date): Promise<Array<{ categoria: string; total: number }>> {
    const fechaFinAjustada = new Date(fechaFin);
    fechaFinAjustada.setHours(23, 59, 59, 999);

    const resultados = await this.gastoModel.aggregate([
      {
        $match: {
          fecha: {
            $gte: fechaInicio,
            $lte: fechaFinAjustada,
          },
        },
      },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$monto' },
        },
      },
      {
        $project: {
          _id: 0,
          categoria: '$_id',
          total: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return resultados;
  }

  async getTotalPorPeriodo(fechaInicio: Date, fechaFin: Date): Promise<number> {
    const fechaFinAjustada = new Date(fechaFin);
    fechaFinAjustada.setHours(23, 59, 59, 999);

    const resultado = await this.gastoModel.aggregate([
      {
        $match: {
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


