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
import { RegistrarMovimientosCajaVentaUseCase } from '../caja/registrar-movimientos-caja-venta.use-case';
import { IConfiguracionRecargosRepository } from '../../ports/configuracion-recargos.repository.interface';

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
    private readonly registrarMovimientosCajaVentaUseCase: RegistrarMovimientosCajaVentaUseCase,
    @Inject('IConfiguracionRecargosRepository')
    private readonly configuracionRecargosRepository: IConfiguracionRecargosRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  /**
   * Evita ventas duplicadas si se recibe el mismo pago en una ventana corta.
   */
  private async encontrarVentaDuplicada(
    vendedorId: string,
    metodosPago: MetodoPago[],
    total: number,
    detalles: DetalleVenta[],
    clienteDNI?: string,
  ): Promise<Venta | null> {
    const totalRedondeado = Math.round(total * 100) / 100;
    console.log(`[SISTEMA-DUPLICADOS] Buscando duplicados para vendedor ${vendedorId}, total ${totalRedondeado}, cliente ${clienteDNI}`);
    // Ventana ultra-corta de 10 segundos (anti doble click)
    const ahora = new Date();
    const ventanaInicio = new Date(ahora.getTime() - 10 * 1000);

    const ventasRecientes = await this.ventaRepository.findByVendedor(vendedorId, ventanaInicio, ahora);
    console.log(`[SISTEMA-DUPLICADOS] Ventas recientes encontradas: ${ventasRecientes.length}`);

    const normalizarPagos = (lista: MetodoPago[]) =>
      lista
        .map((mp) => ({
          tipo: mp.tipo,
          monto: mp.monto,
          referencia: mp.referencia || '',
          cuentaBancaria: mp.cuentaBancaria || '',
          recargo: mp.recargo || 0,
        }))
        .sort((a, b) => `${a.tipo}-${a.monto}`.localeCompare(`${b.tipo}-${b.monto}`));

    const pagosObjetivo = normalizarPagos(metodosPago);

    const normalizarItems = (detalles: any[]) =>
      (detalles || [])
        .map((d) => ({
          productoId: d.productoId || '',
          codigoProducto: d.codigoProducto || '',
          nombreProducto: d.nombreProducto || '',
          cantidad: d.cantidad || 0,
          precioUnitario: d.precioUnitario || 0,
          descuentoItem: d.descuentoItem || 0,
        }))
        .sort((a, b) => `${a.productoId}-${a.cantidad}-${a.precioUnitario}`.localeCompare(`${b.productoId}-${b.cantidad}-${b.precioUnitario}`));

    const itemsObjetivo = normalizarItems(detalles);

    const duplicada = ventasRecientes.find((venta) => {
      const pagosVenta = normalizarPagos(venta.metodosPago);
      const mismosPagos =
        pagosVenta.length === pagosObjetivo.length &&
        pagosVenta.every((p, idx) =>
          p.tipo === pagosObjetivo[idx].tipo &&
          Math.abs(p.monto - pagosObjetivo[idx].monto) < 0.01 &&
          p.referencia === pagosObjetivo[idx].referencia &&
          p.cuentaBancaria === pagosObjetivo[idx].cuentaBancaria &&
          Math.abs((p.recargo || 0) - (pagosObjetivo[idx].recargo || 0)) < 0.01
        );

      // Usar el total guardado en el documento si existe (evita cálculos de dominio en el filtro)
      const ventaTotal = (venta as any).total || venta.calcularTotal();
      const ventaTotalRedondeado = Math.round(ventaTotal * 100) / 100;
      const mismoTotal = Math.abs(ventaTotalRedondeado - totalRedondeado) < 0.01;
      
      // CRÍTICO: Verificar que sea el mismo cliente para considerarla duplicada
      // Si el DNI es distinto, NO es un duplicado aunque el monto sea igual
      const mismoCliente = (venta.clienteDNI || '') === (clienteDNI || '');

      // CRÍTICO: Firmar por items para evitar falsos positivos (mismo monto/pagos pero distinta venta)
      const itemsVenta = normalizarItems((venta as any).detalles || venta.detalles || []);
      const mismosItems =
        itemsVenta.length === itemsObjetivo.length &&
        itemsVenta.every((it, idx) =>
          it.productoId === itemsObjetivo[idx].productoId &&
          it.cantidad === itemsObjetivo[idx].cantidad &&
          Math.abs(it.precioUnitario - itemsObjetivo[idx].precioUnitario) < 0.01 &&
          Math.abs((it.descuentoItem || 0) - (itemsObjetivo[idx].descuentoItem || 0)) < 0.01
        );
      
      return mismosPagos && mismoTotal && mismoCliente && mismosItems;
    }) || null;

    if (duplicada) {
      console.log(`[SISTEMA-DUPLICADOS] ¡DETECTADA VENTA DUPLICADA! Numero: ${duplicada.numero}`);
    }

    return duplicada;
  }

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
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! LOG DE PRUEBA: ESTO DEBERIA APARECER SIEMPRE EN VENTA  !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('[SISTEMA-VENTA] DTO RECIBIDO:', JSON.stringify({
      vendedorId,
      clienteDNI: dto.clienteDNI,
      esCC: dto.esCuentaCorriente,
      cantMetodos: dto.metodosPago?.length,
      metodos: dto.metodosPago?.map(m => m.tipo)
    }));
    const session = await this.connection.startSession();

    console.log(`[CreateVenta] Recibiendo DTO:`, {
      vendedorId,
      clienteDNI: dto.clienteDNI,
      esCuentaCorriente: dto.esCuentaCorriente,
      cantidadMetodos: dto.metodosPago?.length,
      metodos: dto.metodosPago?.map(m => m.tipo)
    });

    const runInTransaction = async () => {
      console.log(`[SISTEMA-VENTA] Iniciando runInTransaction...`);
      if (dto.esCuentaCorriente && !dto.clienteDNI) {
        throw new VentaApplicationException(
          'Para ventas en cuenta corriente es obligatorio informar el DNI del cliente',
        );
      }

      // 1. Validar que todos los productos existan y tengan stock (VALIDACIÓN CRÍTICA)
      const detalles: DetalleVenta[] = [];
      if (dto.items && dto.items.length > 0) {
        const productoIds = dto.items.map((item) => item.productoId);
        const productos = await this.productoRepository.findByIds(productoIds, { session });

        if (productos.length !== productoIds.length) {
          throw new VentaApplicationException('Algunos productos no fueron encontrados en la base de datos', 404);
        }

        const productosMap = new Map(productos.map((p) => [p.id!, p]));

        for (const item of dto.items) {
          const producto = productosMap.get(item.productoId);
          if (!producto || !producto.activo) {
            throw new VentaApplicationException(`Producto ${producto?.nombre || item.productoId} no está activo o no existe`);
          }

          if (producto.stockActual < item.cantidad) {
            throw new VentaApplicationException(`STOCK INSUFICIENTE para ${producto.nombre}. Disponible: ${producto.stockActual}, Solicitado: ${item.cantidad}`, 409);
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

      // Configuración de recargos (débito/crédito). Se aplica automáticamente si el DTO no trae recargo explícito.
      const recargosCfg = await this.configuracionRecargosRepository.get();

      // 2. Crear métodos de pago
      const metodosPago: MetodoPago[] = dto.metodosPago.map((mp) => {
        switch (mp.tipo) {
          case TipoMetodoPago.EFECTIVO: return MetodoPago.efectivo(mp.monto);
          case TipoMetodoPago.TARJETA: return MetodoPago.tarjeta(mp.monto, mp.referencia!);
          case TipoMetodoPago.TRANSFERENCIA: return MetodoPago.transferencia(mp.monto, mp.referencia!, mp.cuentaBancaria!);
          case TipoMetodoPago.DEBITO: {
            const pct = (mp.recargo ?? recargosCfg.recargoDebitoPct) || 0;
            const montoFinal = mp.recargo === undefined ? (mp.monto * (1 + pct / 100)) : mp.monto;
            return MetodoPago.debito(montoFinal, pct);
          }
          case TipoMetodoPago.CREDITO: {
            // Compat: si llega dto.recargoCredito desde clientes viejos, usarlo; si no, usar configuración.
            const pct = (mp.recargo ?? dto.recargoCredito ?? recargosCfg.recargoCreditoPct) || 0;
            const montoFinal = mp.recargo === undefined ? (mp.monto * (1 + pct / 100)) : mp.monto;
            return MetodoPago.credito(montoFinal, pct);
          }
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
        // Nuevo estándar: recargos por tarjeta se modelan por método de pago (mp.recargo).
        // Mantenemos el campo por compatibilidad, pero no se usa como fuente de verdad.
        recargoCredito: 0,
        estado: esPresupuesto ? EstadoVenta.BORRADOR : EstadoVenta.COMPLETADA,
        numero: numeroVenta,
      });

      // Protección contra duplicados inmediatos (doble click / doble request)
      const ventaDuplicada = await this.encontrarVentaDuplicada(vendedorId, metodosPago, venta.calcularTotal(), detalles, dto.clienteDNI);
      if (ventaDuplicada) {
        console.log(`[SISTEMA-DUPLICADOS] Retornando venta existente #${ventaDuplicada.numero}. Saltando creación.`);
        return ventaDuplicada;
      }

      console.log(`[SISTEMA-VENTA] Guardando nueva venta en repositorio...`);
      const ventaGuardada = await this.ventaRepository.save(venta, { session });

      if (!esPresupuesto && detalles.length > 0) {
        // Eliminamos N+1: stock + movimientos_stock en batch dentro de la misma transacción
        await this.registrarVentaStockUseCase.executeBatch(
          detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad })),
          ventaGuardada.id!,
          vendedorId,
          { session },
        );
      }

      // 2.5 Registrar movimientos de caja por venta (uno por método de pago, pagos mixtos)
      // Nota: CUENTA_CORRIENTE no genera movimiento de caja.
      if (!esPresupuesto) {
        await this.registrarMovimientosCajaVentaUseCase.registrarPorVenta(
          { venta: ventaGuardada, usuarioId: vendedorId },
          { session },
        );
      }

      await this.registrarAuditoriaUseCase.execute({
        entidad: 'venta',
        entidadId: ventaGuardada.id!,
        evento: TipoEventoAuditoria.CREACION,
        snapshot: ventaGuardada,
        usuarioId: vendedorId,
      }, { session });

      if (!esPresupuesto) {
        console.log(`[SISTEMA-CC] Venta guardada con éxito. ID: ${ventaGuardada.id}.`);
        await this.registrarMovimientoVentaUseCase.execute({ venta: ventaGuardada, tipoEvento: TipoEventoVenta.CREACION, usuarioId: vendedorId }, { session });

        // Lógica mejorada: Si existe un pago en Cuenta Corriente, registrar el cargo
        const tienePagoCC = ventaGuardada.metodosPago.some(mp => 
          mp.tipo === TipoMetodoPago.CUENTA_CORRIENTE || String(mp.tipo) === 'CUENTA_CORRIENTE'
        );
        
        console.log(`[SISTEMA-CC] Evaluación para DNI ${dto.clienteDNI}: esCC_Venta=${ventaGuardada.esCuentaCorriente}, tienePagoCC=${tienePagoCC}`);

        if ((ventaGuardada.esCuentaCorriente || tienePagoCC) && dto.clienteDNI) {
          console.log(`[SISTEMA-CC] DISPARANDO CARGO EN CC...`);
          try {
            await this.registrarMovimientoCCVentaUseCase.ejecutarCargoPorVenta({ 
              venta: ventaGuardada, 
              clienteDNI: dto.clienteDNI, 
              usuarioId: vendedorId 
            }, { session });
            console.log(`[SISTEMA-CC] CARGO EN CC COMPLETADO`);
          } catch (ccError: any) {
            console.error(`[SISTEMA-CC] ERROR AL EJECUTAR CARGO: ${ccError.message}`);
            throw ccError;
          }
        }
      }

      console.log(`[SISTEMA-CC] Fin de proceso para Venta #${ventaGuardada.numero}`);
      return ventaGuardada;
    };

    try {
      let result: Venta | undefined;

      try {
        await session.withTransaction(async () => {
          result = await runInTransaction();
        });
      } catch (error: any) {
        if (String(error?.message || '').includes('Transaction numbers are only allowed on a replica set member')) {
          throw new Error(
            'MongoDB debe estar configurado como Replica Set para usar transacciones. ' +
            'Configura un replica set (incluso single-node) y reinicia la aplicación.',
          );
        }
        throw error;
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
