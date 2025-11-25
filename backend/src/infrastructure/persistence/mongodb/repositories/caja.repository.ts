import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICajaRepository } from '../../../../application/ports/caja.repository.interface';
import { CierreCaja } from '../../../../domain/entities/cierre-caja.entity';
import { CierreCajaMongo, CierreCajaDocument } from '../schemas/cierre-caja.schema';
import { CierreCajaMapper } from '../mappers/cierre-caja.mapper';

@Injectable()
export class CajaRepository implements ICajaRepository {
  constructor(
    @InjectModel(CierreCajaMongo.name)
    private cierreCajaModel: Model<CierreCajaDocument>,
  ) {}

  async save(cierreCaja: CierreCaja): Promise<CierreCaja> {
    const cierreCajaDoc = CierreCajaMapper.toPersistence(cierreCaja);

    if (cierreCaja.id) {
      const updated = await this.cierreCajaModel
        .findByIdAndUpdate(cierreCaja.id, cierreCajaDoc, { new: true })
        .exec();
      return CierreCajaMapper.toDomain(updated);
    } else {
      const created = await this.cierreCajaModel.create(cierreCajaDoc);
      return CierreCajaMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<CierreCaja | null> {
    const cierreCajaDoc = await this.cierreCajaModel.findById(id).exec();
    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }

  async findByFecha(fecha: Date): Promise<CierreCaja | null> {
    // Normalizar fecha a UTC para evitar problemas de zona horaria
    const año = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    const dia = fecha.getUTCDate();
    const inicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
    const fin = new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999));

    const cierreCajaDoc = await this.cierreCajaModel
      .findOne({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .exec();

    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }

  async findByRangoFechas(desde: Date, hasta: Date): Promise<CierreCaja[]> {
    // Normalizar fechas a UTC
    const añoDesde = desde.getUTCFullYear();
    const mesDesde = desde.getUTCMonth();
    const diaDesde = desde.getUTCDate();
    const inicio = new Date(Date.UTC(añoDesde, mesDesde, diaDesde, 0, 0, 0, 0));
    
    const añoHasta = hasta.getUTCFullYear();
    const mesHasta = hasta.getUTCMonth();
    const diaHasta = hasta.getUTCDate();
    const fin = new Date(Date.UTC(añoHasta, mesHasta, diaHasta, 23, 59, 59, 999));

    const cierresDocs = await this.cierreCajaModel
      .find({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .sort({ fecha: -1 })
      .exec();

    return cierresDocs.map((doc) => CierreCajaMapper.toDomain(doc));
  }

  async update(cierreCaja: CierreCaja): Promise<CierreCaja> {
    return this.save(cierreCaja);
  }

  async findCajaAbierta(fecha: Date): Promise<CierreCaja | null> {
    // Normalizar fecha a UTC
    const año = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    const dia = fecha.getUTCDate();
    const inicio = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
    const fin = new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999));

    const cierreCajaDoc = await this.cierreCajaModel
      .findOne({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
        estado: 'ABIERTO',
      })
      .exec();

    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }
}




