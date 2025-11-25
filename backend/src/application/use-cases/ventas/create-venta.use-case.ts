import { Injectable, Inject } from '@nestjs/common';
import { Venta } from '../../../domain/entities/venta.entity';
import { DetalleVenta } from '../../../domain/entities/detalle-venta.entity';
import { MetodoPago } from '../../../domain/value-objects/metodo-pago.vo';
import { IVentaRepository } from '../../ports/venta.repository.interface';
import { IProductoRepository } from '../../ports/producto.repository.interface';
import { CreateVentaDto } from '../../dtos/ventas/create-venta.dto';
import { VentaApplicationException } from '../../exceptions/venta-application.exception';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../../../domain/enums/tipo-comprobante.enum';
import { EstadoVenta } from '../../../domain/enums/estado-venta.enum';

@Injectable()
export class CreateVentaUseCase {
  constructor(
    @Inject('IVentaRepository')
    private readonly ventaRepository: IVentaRepository,
    @Inject('IProductoRepository')
    private readonly productoRepository: IProductoRepository,
  ) {}

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
    // 1. Validar que todos los productos existan y tengan stock (si hay items)
    const detalles: DetalleVenta[] = [];

    // Permitir ventas sin productos (solo registro de pago)
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        // Validar que el productoId sea válido
        if (!item.productoId || item.productoId.trim() === '' || item.productoId === 'string') {
          throw new VentaApplicationException(
            `ID de producto inválido: "${item.productoId}". Debe ser un ObjectId válido de MongoDB.`,
            400,
            'PRODUCTO_ID_INVALIDO',
          );
        }

        const producto = await this.productoRepository.findById(item.productoId);

        if (!producto) {
          throw new VentaApplicationException(
            `Producto con ID ${item.productoId} no encontrado`,
            404,
            'PRODUCTO_NO_ENCONTRADO',
          );
        }

        if (!producto.activo) {
          throw new VentaApplicationException(
            `El producto ${producto.nombre} está inactivo`,
          );
        }

        if (!producto.tieneStockSuficiente(item.cantidad)) {
          throw new VentaApplicationException(
            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}, Solicitado: ${item.cantidad}`,
          );
        }

        const precioFinal = item.precioUnitario || producto.precioVenta;

        const detalle = DetalleVenta.crear({
          productoId: producto.id!,
          codigoProducto: producto.codigo,
          nombreProducto: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: precioFinal,
          descuentoItem: item.descuentoItem || 0,
        });

        detalles.push(detalle);
      }
    }

    // 2. Crear métodos de pago
    const metodosPago: MetodoPago[] = dto.metodosPago.map((mp) => {
      switch (mp.tipo) {
        case TipoMetodoPago.EFECTIVO:
          return MetodoPago.efectivo(mp.monto);
        
        case TipoMetodoPago.TARJETA:
          if (!mp.referencia) {
            throw new VentaApplicationException(
              'El método de pago TARJETA requiere referencia',
            );
          }
          return MetodoPago.tarjeta(mp.monto, mp.referencia);
        
        case TipoMetodoPago.TRANSFERENCIA:
          // Generar referencia automática si no se proporciona (para ventas simples)
          const referenciaTransferencia = mp.referencia || `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          if (!mp.cuentaBancaria) {
            throw new VentaApplicationException(
              'El método de pago TRANSFERENCIA requiere especificar la cuenta bancaria',
            );
          }
          return MetodoPago.transferencia(
            mp.monto,
            referenciaTransferencia,
            mp.cuentaBancaria,
          );
        
        case TipoMetodoPago.DEBITO:
          // Débito puede tener recargo del 5% opcionalmente
          const recargoDebito = mp.recargo || 0; // 0 por defecto, 5% si se especifica
          return MetodoPago.debito(mp.monto, recargoDebito > 0 ? recargoDebito : undefined);
        
        case TipoMetodoPago.CREDITO:
          // Crédito siempre lleva 10% (puede cambiarse manualmente)
          const recargoCredito = dto.recargoCredito || 10; // Por defecto 10%
          return MetodoPago.credito(mp.monto, recargoCredito);
        
        case TipoMetodoPago.CUENTA_CORRIENTE:
          return MetodoPago.cuentaCorriente(mp.monto);
        
        default:
          throw new VentaApplicationException(
            `Método de pago no válido: ${mp.tipo}`,
          );
      }
    });

    // 3. Validar tipo de comprobante (REMITO por defecto, ya que es el más usado - 80%)
    const tipoComprobante = dto.tipoComprobante || TipoComprobante.REMITO;
    
    // Si es PRESUPUESTO, NO se descontará stock ni se guardará como venta real
    const esPresupuesto = tipoComprobante === TipoComprobante.PRESUPUESTO;

    // 4. Crear la venta con verificación de número único
    let venta: Venta;
    let intentos = 0;
    const maxIntentos = 10;
    let numeroVenta: string | undefined;
    
    do {
      // Generar número solo si no se ha generado uno único aún
      if (!numeroVenta) {
        numeroVenta = this.generarNumeroVentaUnico(tipoComprobante);
      }
      
      // Verificar si el número ya existe
      const ventaExistente = await this.ventaRepository.findByNumero(numeroVenta);
      if (!ventaExistente) {
        break; // Número único, continuar
      }
      
      intentos++;
      if (intentos >= maxIntentos) {
        throw new VentaApplicationException(
          `No se pudo generar un número de venta único después de ${maxIntentos} intentos`,
        );
      }
      
      // Generar un nuevo número con un pequeño delay para cambiar el timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      numeroVenta = this.generarNumeroVentaUnico(tipoComprobante);
    } while (intentos < maxIntentos);
    
    // Crear la venta con el número único generado
    venta = Venta.crear({
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

    // 5. Descontar stock de cada producto SOLO si NO es presupuesto y hay detalles
    if (!esPresupuesto && detalles.length > 0) {
      for (const detalle of detalles) {
        const producto = await this.productoRepository.findById(detalle.productoId);
        if (!producto) {
          throw new VentaApplicationException(
            `Producto ${detalle.productoId} no encontrado al descontar stock`,
          );
        }
        producto.descontar(detalle.cantidad);
        await this.productoRepository.update(producto);
      }
    }

    // 6. Guardar la venta (o presupuesto)
    const ventaGuardada = await this.ventaRepository.save(venta);

    // 7. TODO: Si es cuenta corriente, actualizar saldo del cliente
    // if (dto.esCuentaCorriente && dto.clienteDNI) {
    //   await this.clienteRepository.actualizarSaldo(dto.clienteDNI, ventaGuardada.calcularTotal());
    // }

    // 8. TODO: Emitir evento de dominio (VentaCreada)
    // await this.eventBus.publish(new VentaCreadaEvent(ventaGuardada));

    return ventaGuardada;
  }
}

