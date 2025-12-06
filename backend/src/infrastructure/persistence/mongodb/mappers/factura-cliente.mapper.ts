import { FacturaCliente } from '../../../../domain/entities/factura-cliente.entity';
import { Types } from 'mongoose';

export class FacturaClienteMapper {
  static toDomain(facturaDoc: any): FacturaCliente {
    if (!facturaDoc) return null;

    const factura = new FacturaCliente(
      facturaDoc._id.toString(),
      facturaDoc.numero,
      facturaDoc.clienteId?.toString() || facturaDoc.clienteId,
      facturaDoc.fecha,
      facturaDoc.fechaVencimiento,
      facturaDoc.montoTotal,
      facturaDoc.descripcion,
      facturaDoc.observaciones,
      facturaDoc.ventaId?.toString(),
      facturaDoc.createdAt,
      facturaDoc.updatedAt,
    );

    factura.montoPagado = facturaDoc.montoPagado || 0;

    return factura;
  }

  static toPersistence(factura: FacturaCliente): any {
    const facturaDoc: any = {
      numero: factura.numero,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      montoTotal: factura.montoTotal,
      montoPagado: factura.montoPagado,
      descripcion: factura.descripcion,
      observaciones: factura.observaciones,
    };

    if (factura.id) {
      facturaDoc._id = Types.ObjectId.isValid(factura.id)
        ? new Types.ObjectId(factura.id)
        : factura.id;
    }

    if (factura.clienteId) {
      facturaDoc.clienteId = Types.ObjectId.isValid(factura.clienteId)
        ? new Types.ObjectId(factura.clienteId)
        : factura.clienteId;
    }

    if (factura.ventaId) {
      facturaDoc.ventaId = Types.ObjectId.isValid(factura.ventaId)
        ? new Types.ObjectId(factura.ventaId)
        : factura.ventaId;
    }

    return facturaDoc;
  }
}


