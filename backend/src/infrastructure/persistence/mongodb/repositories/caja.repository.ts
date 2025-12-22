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

  private buildRangoDiaNegocio(fecha: Date): { inicio: Date; fin: Date } {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const dia = fecha.getDate();
    return {
      inicio: new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0)),
      fin: new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999)),
    };
  }

  /**
   * Compat legacy: antes se tomaba el "día" por getUTCDate().
   * Esto movía el día en AR (UTC-3) a partir de las 21:00.
   * Mantenemos fallback para no romper cajas ya abiertas con el esquema viejo.
   */
  private buildRangoDiaLegacyUTC(fecha: Date): { inicio: Date; fin: Date } {
    const año = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    const dia = fecha.getUTCDate();
    return {
      inicio: new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0)),
      fin: new Date(Date.UTC(año, mes, dia, 23, 59, 59, 999)),
    };
  }

  async save(cierreCaja: CierreCaja, options?: { session?: any }): Promise<CierreCaja> {
    const session = options?.session;
    const cierreCajaDoc = CierreCajaMapper.toPersistence(cierreCaja);

    if (cierreCaja.id) {
      const updated = await this.cierreCajaModel
        .findByIdAndUpdate(cierreCaja.id, cierreCajaDoc, { new: true, session })
        .exec();
      return CierreCajaMapper.toDomain(updated);
    } else {
      const [created] = await this.cierreCajaModel.create([cierreCajaDoc], { session });
      return CierreCajaMapper.toDomain(created);
    }
  }

  async findById(id: string): Promise<CierreCaja | null> {
    const cierreCajaDoc = await this.cierreCajaModel.findById(id).exec();
    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }

  async findByFecha(fecha: Date): Promise<CierreCaja | null> {
    // Normalizar por "día de negocio" (calendario local), almacenado como UTC 00:00 del día local.
    const { inicio, fin } = this.buildRangoDiaNegocio(fecha);

    let cierreCajaDoc = await this.cierreCajaModel
      .findOne({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .exec();

    // Fallback legacy (cajas existentes creadas con día UTC)
    if (!cierreCajaDoc) {
      const legacy = this.buildRangoDiaLegacyUTC(fecha);
      cierreCajaDoc = await this.cierreCajaModel
        .findOne({
          fecha: {
            $gte: legacy.inicio,
            $lte: legacy.fin,
          },
        })
        .exec();
    }

    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }

  async findByRangoFechas(desde: Date, hasta: Date): Promise<CierreCaja[]> {
    // Normalizar fechas por "día de negocio" (calendario local)
    const añoDesde = desde.getFullYear();
    const mesDesde = desde.getMonth();
    const diaDesde = desde.getDate();
    const inicio = new Date(Date.UTC(añoDesde, mesDesde, diaDesde, 0, 0, 0, 0));
    
    const añoHasta = hasta.getFullYear();
    const mesHasta = hasta.getMonth();
    const diaHasta = hasta.getDate();
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

  async update(cierreCaja: CierreCaja, options?: { session?: any }): Promise<CierreCaja> {
    return this.save(cierreCaja, options);
  }

  async findCajaAbierta(fecha: Date, options?: { session?: any }): Promise<CierreCaja | null> {
    const session = options?.session;
    // Normalizar por "día de negocio" (calendario local)
    const { inicio, fin } = this.buildRangoDiaNegocio(fecha);

    let cierreCajaDoc = await this.cierreCajaModel
      .findOne({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
        estado: 'ABIERTO',
      }, null, { session })
      .exec();

    // Fallback legacy (cajas existentes creadas con día UTC)
    if (!cierreCajaDoc) {
      const legacy = this.buildRangoDiaLegacyUTC(fecha);
      cierreCajaDoc = await this.cierreCajaModel
        .findOne({
          fecha: {
            $gte: legacy.inicio,
            $lte: legacy.fin,
          },
          estado: 'ABIERTO',
        }, null, { session })
        .exec();
    }

    return cierreCajaDoc ? CierreCajaMapper.toDomain(cierreCajaDoc) : null;
  }
}




