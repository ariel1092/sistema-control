import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IVentaRepository } from '../../../../application/ports/venta.repository.interface';
import { Venta } from '../../../../domain/entities/venta.entity';
import { VentaMongo, VentaDocument } from '../schemas/venta.schema';
import { DetalleVentaMongo, DetalleVentaDocument } from '../schemas/detalle-venta.schema';
import { VentaMapper } from '../mappers/venta.mapper';
import { EstadoVenta } from '../../../../domain/enums/estado-venta.enum';

@Injectable()
export class VentaRepository implements IVentaRepository {
  constructor(
    @InjectModel(VentaMongo.name)
    private ventaModel: Model<VentaDocument>,
    @InjectModel(DetalleVentaMongo.name)
    private detalleVentaModel: Model<DetalleVentaDocument>,
  ) {}

  async save(venta: Venta): Promise<Venta> {
    const { venta: ventaDoc, detalles: detallesDocs } =
      VentaMapper.toPersistence(venta);

    // Guardar o actualizar venta
    let ventaGuardada;
    if (venta.id) {
      ventaGuardada = await this.ventaModel
        .findByIdAndUpdate(venta.id, ventaDoc, { new: true })
        .exec();
      
      // Eliminar detalles antiguos
      await this.detalleVentaModel.deleteMany({
        ventaId: new Types.ObjectId(venta.id),
      }).exec();
    } else {
      ventaGuardada = await this.ventaModel.create(ventaDoc);
    }

    // Guardar detalles
    const detallesGuardados = await this.detalleVentaModel.insertMany(
      detallesDocs.map((det) => ({
        ...det,
        ventaId: ventaGuardada._id,
      })),
    );

    // Retornar dominio con los IDs generados
    return VentaMapper.toDomain(ventaGuardada, detallesGuardados as any[]);
  }

  async findById(id: string): Promise<Venta | null> {
    const ventaDoc = await this.ventaModel.findById(id).exec();
    if (!ventaDoc) return null;

    const detallesDocs = await this.detalleVentaModel
      .find({ ventaId: new Types.ObjectId(id) })
      .exec();

    return VentaMapper.toDomain(ventaDoc, detallesDocs);
  }

  async findByNumero(numero: string): Promise<Venta | null> {
    const ventaDoc = await this.ventaModel.findOne({ numero }).exec();
    if (!ventaDoc) return null;

    const detallesDocs = await this.detalleVentaModel
      .find({ ventaId: ventaDoc._id })
      .exec();

    return VentaMapper.toDomain(ventaDoc, detallesDocs);
  }

  async findByFecha(fecha: Date): Promise<Venta[]> {
    // Normalizar fecha a UTC para evitar problemas de zona horaria
    const inicio = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0));
    const fin = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999));

    const ventasDocs = await this.ventaModel
      .find({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .sort({ fecha: -1 })
      .exec();

    const ventas: Venta[] = [];

    for (const ventaDoc of ventasDocs) {
      const detallesDocs = await this.detalleVentaModel
        .find({ ventaId: ventaDoc._id })
        .exec();
      ventas.push(VentaMapper.toDomain(ventaDoc, detallesDocs));
    }

    return ventas;
  }

  async findByRangoFechas(desde: Date, hasta: Date): Promise<Venta[]> {
    // Normalizar fechas a UTC para evitar problemas de zona horaria
    // Si las fechas ya están normalizadas (vienen de GetVentasDiaUseCase), usarlas directamente
    // Si no, normalizarlas a UTC
    let inicio: Date;
    let fin: Date;

    // Verificar si las fechas ya están normalizadas (tienen horas 0:0:0 o 23:59:59)
    const desdeNormalizado = desde.getHours() === 0 && desde.getMinutes() === 0 && desde.getSeconds() === 0;
    const hastaNormalizado = hasta.getHours() === 23 && hasta.getMinutes() === 59 && hasta.getSeconds() === 59;

    if (desdeNormalizado && hastaNormalizado) {
      // Las fechas ya están normalizadas, usarlas directamente
      inicio = new Date(desde);
      fin = new Date(hasta);
    } else {
      // Normalizar a UTC
      inicio = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0));
      fin = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999));
    }

    // DEBUG: Log para verificar el rango de fechas consultado
    console.log(`[VentaRepository] Consultando ventas desde: ${inicio.toISOString()} hasta: ${fin.toISOString()}`);

    const ventasDocs = await this.ventaModel
      .find({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .sort({ fecha: -1 })
      .exec();

    console.log(`[VentaRepository] Ventas encontradas en MongoDB: ${ventasDocs.length}`);
    
    // DEBUG: Mostrar fechas de las primeras 5 ventas para verificar
    if (ventasDocs.length > 0) {
      console.log(`[VentaRepository] Primeras 5 fechas de ventas encontradas:`);
      ventasDocs.slice(0, 5).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.fecha.toISOString()}`);
      });
    }

    const ventas: Venta[] = [];

    for (const ventaDoc of ventasDocs) {
      const detallesDocs = await this.detalleVentaModel
        .find({ ventaId: ventaDoc._id })
        .exec();
      ventas.push(VentaMapper.toDomain(ventaDoc, detallesDocs));
    }

    return ventas;
  }

  async findByVendedor(
    vendedorId: string,
    desde?: Date,
    hasta?: Date,
  ): Promise<Venta[]> {
    const query: any = {
      vendedorId: new Types.ObjectId(vendedorId),
    };

    if (desde && hasta) {
      // Normalizar fechas a UTC
      const inicio = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0));
      const fin = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999));
      query.fecha = {
        $gte: inicio,
        $lte: fin,
      };
    } else if (desde) {
      const inicio = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0));
      query.fecha = { $gte: inicio };
    } else if (hasta) {
      const fin = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999));
      query.fecha = { $lte: fin };
    }

    const ventasDocs = await this.ventaModel
      .find(query)
      .sort({ fecha: -1 })
      .exec();

    const ventas: Venta[] = [];

    for (const ventaDoc of ventasDocs) {
      const detallesDocs = await this.detalleVentaModel
        .find({ ventaId: ventaDoc._id })
        .exec();
      ventas.push(VentaMapper.toDomain(ventaDoc, detallesDocs));
    }

    return ventas;
  }

  async update(venta: Venta): Promise<Venta> {
    return this.save(venta);
  }

  async delete(id: string): Promise<void> {
    // Soft delete: marcar como cancelada
    await this.ventaModel
      .findByIdAndUpdate(id, {
        estado: EstadoVenta.CANCELADA,
      })
      .exec();
  }

  async countByFecha(fecha: Date): Promise<number> {
    // Normalizar fecha a UTC
    const inicio = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0));
    const fin = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999));

    return this.ventaModel
      .countDocuments({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
        estado: EstadoVenta.COMPLETADA,
      })
      .exec();
  }
}

