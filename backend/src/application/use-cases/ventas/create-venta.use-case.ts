import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Venta } from '../../../domain/entities/venta.entity';
import { DetalleVenta } from '../../../domain/entities/detalle-venta.entity';
import { MetodoPago } from '../../../domain/value-objects/metodo-pago.vo';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { RegistrarVentaStockUseCase } from '../productos/registrar-venta-stock.use-case';
import { CreateVentaDto } from '../../dtos/ventas/create-venta.dto';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../../../domain/enums/tipo-comprobante.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';
import { RegistrarMovimientoVentaUseCase } from './registrar-movimiento-venta.use-case';
import { TipoEventoVenta } from '../../../domain/enums/tipo-evento-venta.enum';
import { RegistrarMovimientoCCVentaUseCase } from './registrar-movimiento-cc-venta.use-case';
import { RegistrarAuditoriaUseCase } from '../auditoria/registrar-auditoria.use-case';
import { TipoEventoAuditoria } from '../../../domain/enums/tipo-evento-auditoria.enum';

@Injectable()
export class CreateVentaUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
    private readonly registrarVentaStockUseCase: RegistrarVentaStockUseCase,
    private readonly registrarMovimientoVentaUseCase: RegistrarMovimientoVentaUseCase,
    private readonly registrarMovimientoCCVentaUseCase: RegistrarMovimientoCCVentaUseCase,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  private generarNumeroVentaUnico(tipoComprobante?: TipoComprobante): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    // Usar timestamp en milisegundos para garantizar unicidad
    // Tomar los últimos 6 dígitos del timestamp para mantener formato corto
    const timestamp = Date.now();
    const secuencial = timestamp.toString().slice(-6);

    // Prefijo según tipo de comprobante
    let prefijo = 'VTA';
    switch (tipoComprobante) {
      case TipoComprobante.PRESUPUESTO:
        prefijo = 'PRES';
        break;
      case TipoComprobante.REMITO:
        prefijo = 'REM';
        break;
      case TipoComprobante.FACTURA:
        prefijo = 'FAC';
        break;
      default:
        prefijo = 'VTA';
    }

    return `${prefijo}-${año}${mes}${dia}-${secuencial}`;
  }

  async execute(dto: CreateVentaDto, vendedorId: string): Promise<Venta> {
    const session = await this.connection.startSession();

    const runInTransaction = async () => {
      if (dto.esCuentaCorriente && !dto.clienteDNI) {
        throw new VentaApplicationException(
          'Para ventas en cuenta corriente es obligatorio informar el DNI del cliente',
        );
      }

      // 1. Validar que todos los productos existan y tengan stock
      const detalles: DetalleVenta[] = [];
      if (dto.items && dto.items.length > 0) {
        const productoIds = dto.items.map((item) => item.productoId);
        const productos = await this.productoRepository.findByIds(productoIds);

        if (productos.length !== productoIds.length) {
          throw new VentaApplicationException('Algunos productos no fueron encontrados', 404);
        }

        const productosMap = new Map(productos.map((p) => [p.id!, p]));

        for (const item of dto.items) {
          const producto = productosMap.get(item.productoId);
          if (!producto || !producto.activo) {
            throw new VentaApplicationException(`Producto ${producto?.nombre || item.productoId} no encontrado o inactivo`);
          }

          if (!producto.tieneStockSuficiente(item.cantidad)) {
            throw new VentaApplicationException(`Stock insuficiente para ${producto.nombre}`);
          }

          detalles.push(DetalleVenta.crear({
            productoId: producto.id!,
            codigoProducto: producto.codigo,
            nombreProducto: producto.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario || producto.precioVenta,
            descuentoItem: item.descuentoItem || 0,
          }));
        }
      }

      // 2. Crear métodos de pago
      const metodosPago: MetodoPago[] = dto.metodosPago.map((mp) => {
        switch (mp.tipo) {
          case TipoMetodoPago.EFECTIVO: return MetodoPago.efectivo(mp.monto);
          case TipoMetodoPago.TARJETA: return MetodoPago.tarjeta(mp.monto, mp.referencia!);
          case TipoMetodoPago.TRANSFERENCIA: return MetodoPago.transferencia(mp.monto, mp.referencia!, mp.cuentaBancaria!);
          case TipoMetodoPago.DEBITO: return MetodoPago.debito(mp.monto, mp.recargo);
          case TipoMetodoPago.CREDITO: return MetodoPago.credito(mp.monto, dto.recargoCredito || 10);
          case TipoMetodoPago.CUENTA_CORRIENTE: return MetodoPago.cuentaCorriente(mp.monto);
          default: throw new VentaApplicationException(`Método de pago no válido: ${mp.tipo}`);
        }
      });

      const tipoComprobante = dto.tipoComprobante || TipoComprobante.REMITO;
      const esPresupuesto = tipoComprobante === TipoComprobante.PRESUPUESTO;
      const numeroVenta = this.generarNumeroVentaUnico(tipoComprobante);

      const venta = Venta.crear({
        vendedorId,
        detalles,
        metodosPago,
        clienteNombre: dto.clienteNombre,
        clienteDNI: dto.clienteDNI,
        descuentoGeneral: dto.descuentoGeneral || 0,
        observaciones: dto.observaciones,
        tipoComprobante,
        esCuentaCorriente: dto.esCuentaCorriente || false,
        recargoCredito: dto.recargoCredito || 0,
        estado: esPresupuesto ? EstadoVenta.BORRADOR : EstadoVenta.COMPLETADA,
        numero: numeroVenta,
      });

      const ventaGuardada = await this.ventaRepository.save(venta, { session: session.inTransaction() ? session : undefined });

      if (!esPresupuesto && detalles.length > 0) {
        await Promise.all(detalles.map((detalle) =>
          this.registrarVentaStockUseCase.execute(detalle.productoId, detalle.cantidad, ventaGuardada.id!, vendedorId, { session: session.inTransaction() ? session : undefined })
        ));
      }

      await this.registrarAuditoriaUseCase.execute({
        entidad: 'venta',
        entidadId: ventaGuardada.id!,
        evento: TipoEventoAuditoria.CREACION,
        snapshot: ventaGuardada,
        usuarioId: vendedorId,
      }, { session: session.inTransaction() ? session : undefined });

      if (!esPresupuesto) {
        await this.registrarMovimientoVentaUseCase.execute({ venta: ventaGuardada, tipoEvento: TipoEventoVenta.CREACION, usuarioId: vendedorId }, { session: session.inTransaction() ? session : undefined });

        if (ventaGuardada.esCuentaCorriente && dto.clienteDNI) {
          await this.registrarMovimientoCCVentaUseCase.ejecutarCargoPorVenta({ venta: ventaGuardada, clienteDNI: dto.clienteDNI, usuarioId: vendedorId }, { session: session.inTransaction() ? session : undefined });
        }
      }

      return ventaGuardada;
    };

    try {
      let result: Venta | undefined;
      try {
        await session.withTransaction(async () => {
          result = await runInTransaction();
        });
      } catch (error: any) {
        // Si falla porque no hay replica set, intentamos sin transacción
        if (error.message.includes('Transaction numbers are only allowed on a replica set member')) {
          console.warn('⚠️ MongoDB no es un Replica Set. Ejecutando sin transacciones...');
          result = await runInTransaction();
        } else {
          throw error;
        }
      }

      if (result && (dto.tipoComprobante !== TipoComprobante.PRESUPUESTO)) {
        // En desarrollo, simplemente dejamos que el caché expire o limpiamos lo necesario
        // Por ahora, para evitar errores de tipos con diferentes versiones de cache-manager
        const hoy = new Date();
        const fechaKey = `${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}`;
        await this.cacheManager.del(`productos:all:all:50:0`); // Limpiar primera página por si acaso
        await this.cacheManager.del(`ventas:${fechaKey}:all`);
      }

      return result!;
    } finally {
      await session.endSession();
    }
  }
}
