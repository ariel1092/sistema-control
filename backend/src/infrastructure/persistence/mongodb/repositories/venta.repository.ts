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
  ) { }

  async save(venta: Venta, options?: { session?: any }): Promise<Venta> {
    const { venta: ventaDoc, detalles: detallesDocs } =
      VentaMapper.toPersistence(venta);

    const session = options?.session;

    // Logs removidos en producción para mejorar performance

    // Guardar o actualizar venta
    let ventaGuardada;
    if (venta.id) {
      ventaGuardada = await this.ventaModel
        .findByIdAndUpdate(venta.id, ventaDoc, { new: true, session })
        .exec();

      // Eliminar detalles antiguos
      await this.detalleVentaModel.deleteMany({
        ventaId: new Types.ObjectId(venta.id),
      }, { session }).exec();
    } else {
      const [created] = await this.ventaModel.create([ventaDoc], { session });
      ventaGuardada = created;
    }

    // Guardar detalles
    const detallesGuardados = await this.detalleVentaModel.insertMany(
      detallesDocs.map((det) => ({
        ...det,
        ventaId: ventaGuardada._id,
      })),
      { session }
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

    // OPTIMIZACIÓN: Eliminar N+1 queries - cargar todos los detalles en un solo query
    if (ventasDocs.length === 0) {
      return [];
    }

    const ventaIds = ventasDocs.map((v) => v._id);
    const todosDetalles = await this.detalleVentaModel
      .find({ ventaId: { $in: ventaIds } })
      .exec();

    // Agrupar detalles por ventaId en memoria
    const detallesPorVenta = new Map<string, typeof todosDetalles>();
    todosDetalles.forEach((detalle) => {
      const ventaIdStr = detalle.ventaId.toString();
      if (!detallesPorVenta.has(ventaIdStr)) {
        detallesPorVenta.set(ventaIdStr, []);
      }
      detallesPorVenta.get(ventaIdStr)!.push(detalle);
    });

    // Mapear ventas con sus detalles
    const ventas: Venta[] = ventasDocs.map((ventaDoc) => {
      const detallesDocs = detallesPorVenta.get(ventaDoc._id.toString()) || [];
      return VentaMapper.toDomain(ventaDoc, detallesDocs);
    });

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

    // Logs removidos en producción para mejorar performance

    const ventasDocs = await this.ventaModel
      .find({
        fecha: {
          $gte: inicio,
          $lte: fin,
        },
      })
      .sort({ fecha: -1 })
      .exec();

    // OPTIMIZACIÓN: Eliminar N+1 queries - cargar todos los detalles en un solo query
    if (ventasDocs.length === 0) {
      return [];
    }

    const ventaIds = ventasDocs.map((v) => v._id);
    const todosDetalles = await this.detalleVentaModel
      .find({ ventaId: { $in: ventaIds } })
      .exec();

    // Agrupar detalles por ventaId en memoria
    const detallesPorVenta = new Map<string, typeof todosDetalles>();
    todosDetalles.forEach((detalle) => {
      const ventaIdStr = detalle.ventaId.toString();
      if (!detallesPorVenta.has(ventaIdStr)) {
        detallesPorVenta.set(ventaIdStr, []);
      }
      detallesPorVenta.get(ventaIdStr)!.push(detalle);
    });

    // Mapear ventas con sus detalles
    const ventas: Venta[] = ventasDocs.map((ventaDoc) => {
      const detallesDocs = detallesPorVenta.get(ventaDoc._id.toString()) || [];
      return VentaMapper.toDomain(ventaDoc, detallesDocs);
    });

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

    /**
     * IMPORTANTE:
     * - `fecha` en ventas se normaliza a 00:00 (día) para reportes.
     * - Para ventanas cortas (anti doble-click) necesitamos filtrar por `createdAt`.
     *
     * Regla:
     * - Si el rango recibido está "normalizado" (00:00..23:59) => filtrar por `fecha`.
     * - Si NO está normalizado (incluye hora/min/seg) => filtrar por `createdAt` (preciso).
     */
    const esInicioDia = (d: Date) =>
      d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
    const esFinDia = (d: Date) =>
      d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() === 59 && d.getMilliseconds() >= 0;

    if (desde && hasta) {
      const rangoNormalizado = esInicioDia(desde) && esFinDia(hasta);
      if (rangoNormalizado) {
        const inicio = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0));
        const fin = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999));
        query.fecha = { $gte: inicio, $lte: fin };
      } else {
        query.createdAt = { $gte: desde, $lte: hasta };
      }
    } else if (desde) {
      if (esInicioDia(desde)) {
        const inicio = new Date(Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0));
        query.fecha = { $gte: inicio };
      } else {
        query.createdAt = { $gte: desde };
      }
    } else if (hasta) {
      if (esFinDia(hasta)) {
        const fin = new Date(Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999));
        query.fecha = { $lte: fin };
      } else {
        query.createdAt = { $lte: hasta };
      }
    }

    const ventasDocs = await this.ventaModel
      .find(query)
      .sort({ fecha: -1 })
      .exec();

    // OPTIMIZACIÓN: Eliminar N+1 queries - cargar todos los detalles en un solo query
    if (ventasDocs.length === 0) {
      return [];
    }

    const ventaIds = ventasDocs.map((v) => v._id);
    const todosDetalles = await this.detalleVentaModel
      .find({ ventaId: { $in: ventaIds } })
      .exec();

    // Agrupar detalles por ventaId en memoria
    const detallesPorVenta = new Map<string, typeof todosDetalles>();
    todosDetalles.forEach((detalle) => {
      const ventaIdStr = detalle.ventaId.toString();
      if (!detallesPorVenta.has(ventaIdStr)) {
        detallesPorVenta.set(ventaIdStr, []);
      }
      detallesPorVenta.get(ventaIdStr)!.push(detalle);
    });

    // Mapear ventas con sus detalles
    const ventas: Venta[] = ventasDocs.map((ventaDoc) => {
      const detallesDocs = detallesPorVenta.get(ventaDoc._id.toString()) || [];
      return VentaMapper.toDomain(ventaDoc, detallesDocs);
    });

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

