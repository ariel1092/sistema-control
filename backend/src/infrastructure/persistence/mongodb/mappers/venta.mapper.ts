import { Venta } from '../../../../domain/entities/venta.entity';
import { DetalleVenta } from '../../../../domain/entities/detalle-venta.entity';
import { MetodoPago } from '../../../../domain/value-objects/metodo-pago.vo';
import { EstadoVenta } from '../../../../domain/enums/estado-venta.enum';
import { TipoMetodoPago } from '../../../../domain/enums/tipo-metodo-pago.enum';
import { TipoComprobante } from '../../../../domain/enums/tipo-comprobante.enum';
import { CuentaBancaria } from '../../../../domain/enums/cuenta-bancaria.enum';
import { VentaMongo } from '../schemas/venta.schema';
import { DetalleVentaMongo } from '../schemas/detalle-venta.schema';
import { Types } from 'mongoose';

export class VentaMapper {
  static toDomain(
    ventaDoc: any,
    detallesDocs: DetalleVentaMongo[],
  ): Venta {
    if (!ventaDoc) return null;

    // Mapear detalles
    const detalles = detallesDocs.map((det) =>
      DetalleVentaMapper.toDomain(det, ventaDoc._id.toString()),
    );

    // Mapear métodos de pago
    const metodosPago = ventaDoc.metodosPago.map((mp: any) => {
      switch (mp.tipo) {
        case TipoMetodoPago.EFECTIVO:
          return MetodoPago.efectivo(mp.monto);
        case TipoMetodoPago.TARJETA:
          return MetodoPago.tarjeta(mp.monto, mp.referencia);
        case TipoMetodoPago.TRANSFERENCIA:
          return MetodoPago.transferencia(
            mp.monto,
            mp.referencia,
            mp.cuentaBancaria as CuentaBancaria,
          );
        case TipoMetodoPago.DEBITO:
          return MetodoPago.debito(mp.monto);
        case TipoMetodoPago.CREDITO:
          return MetodoPago.credito(mp.monto, mp.recargo || 10);
        case TipoMetodoPago.CUENTA_CORRIENTE:
          return MetodoPago.cuentaCorriente(mp.monto);
        default:
          throw new Error(`Tipo de método de pago no válido: ${mp.tipo}`);
      }
    });

    const venta = new Venta(
      ventaDoc._id.toString(),
      ventaDoc.numero,
      ventaDoc.vendedorId.toString(),
      ventaDoc.fecha,
      detalles,
      metodosPago,
      ventaDoc.clienteNombre,
      ventaDoc.clienteDNI,
      ventaDoc.descuentoGeneral,
      ventaDoc.observaciones,
      ventaDoc.estado as EstadoVenta,
      (ventaDoc.tipoComprobante || TipoComprobante.FACTURA) as TipoComprobante,
      ventaDoc.esCuentaCorriente || false,
      ventaDoc.recargoCredito || 0,
      ventaDoc.canceladoPor?.toString(),
      ventaDoc.canceladoEn,
      ventaDoc.createdAt,
      ventaDoc.updatedAt,
    );

    return venta;
  }

  static toPersistence(venta: Venta): {
    venta: Partial<VentaMongo>;
    detalles: Partial<DetalleVentaMongo>[];
  } {
    // Validar que vendedorId sea un ObjectId válido
    let vendedorId: Types.ObjectId;
    try {
      vendedorId = Types.ObjectId.isValid(venta.vendedorId)
        ? new Types.ObjectId(venta.vendedorId)
        : new Types.ObjectId(); // Generar uno nuevo si no es válido
    } catch (error) {
      // Si falla la conversión, generar un nuevo ObjectId
      vendedorId = new Types.ObjectId();
    }

    const ventaDoc: any = {
      numero: venta.numero,
      vendedorId: vendedorId,
      fecha: venta.fecha,
      subtotal: venta.calcularSubtotal(),
      descuentoGeneral: venta.descuentoGeneral,
      total: venta.calcularTotal(),
      metodosPago: venta.metodosPago.map((mp) => mp.toPlainObject()),
      estado: venta.estado,
      observaciones: venta.observaciones,
      tipoComprobante: venta.tipoComprobante,
      esCuentaCorriente: venta.esCuentaCorriente,
      recargoCredito: venta.recargoCredito,
      canceladoPor: venta.canceladoPor && Types.ObjectId.isValid(venta.canceladoPor)
        ? new Types.ObjectId(venta.canceladoPor)
        : undefined,
      canceladoEn: venta.canceladoEn,
    };

    if (venta.id) {
      (ventaDoc as any)._id = new Types.ObjectId(venta.id);
    }

    // Generar un ventaId válido si no existe
    let ventaId: string;
    if (venta.id && Types.ObjectId.isValid(venta.id)) {
      ventaId = venta.id;
    } else if ((ventaDoc as any)._id) {
      ventaId = (ventaDoc as any)._id.toString();
    } else {
      // Si no hay ID, generar uno nuevo
      const nuevoId = new Types.ObjectId();
      (ventaDoc as any)._id = nuevoId;
      ventaId = nuevoId.toString();
    }
    
    // Solo crear detalles si existen (para ventas sin productos)
    const detallesDocs = venta.detalles.length > 0
      ? venta.detalles.map((detalle) =>
          DetalleVentaMapper.toPersistence(detalle, ventaId),
        )
      : [];

    return {
      venta: ventaDoc,
      detalles: detallesDocs,
    };
  }
}

class DetalleVentaMapper {
  static toDomain(
    detalleDoc: any,
    ventaId: string,
  ): DetalleVenta {
    return new DetalleVenta(
      detalleDoc._id ? detalleDoc._id.toString() : undefined,
      ventaId,
      detalleDoc.productoId ? detalleDoc.productoId.toString() : detalleDoc.productoId,
      detalleDoc.codigoProducto,
      detalleDoc.nombreProducto,
      detalleDoc.cantidad,
      detalleDoc.precioUnitario,
      detalleDoc.descuentoItem,
      detalleDoc.createdAt || new Date(),
    );
  }

  static toPersistence(
    detalle: DetalleVenta,
    ventaId: string,
  ): any {
    // Validar que productoId sea un ObjectId válido (puede ser undefined si no hay productos)
    let productoId: Types.ObjectId | undefined;
    if (detalle.productoId) {
      try {
        productoId = Types.ObjectId.isValid(detalle.productoId)
          ? new Types.ObjectId(detalle.productoId)
          : undefined;
      } catch (error) {
        productoId = undefined;
      }
    }

    // Validar que ventaId sea un ObjectId válido
    let ventaIdObj: Types.ObjectId;
    try {
      ventaIdObj = Types.ObjectId.isValid(ventaId)
        ? new Types.ObjectId(ventaId)
        : new Types.ObjectId(); // Generar uno nuevo si no es válido
    } catch (error) {
      ventaIdObj = new Types.ObjectId();
    }

    const doc: any = {
      ventaId: ventaIdObj,
      codigoProducto: detalle.codigoProducto,
      nombreProducto: detalle.nombreProducto,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      descuentoItem: detalle.descuentoItem,
      subtotal: detalle.calcularSubtotal(),
    };

    // Solo agregar productoId si existe (para ventas sin productos)
    if (productoId) {
      doc.productoId = productoId;
    }

    if (detalle.id) {
      (doc as any)._id = new Types.ObjectId(detalle.id);
    }

    return doc;
  }
}

