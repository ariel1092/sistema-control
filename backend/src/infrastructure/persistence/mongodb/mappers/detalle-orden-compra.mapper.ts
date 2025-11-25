import { DetalleOrdenCompra } from '../../../../domain/entities/detalle-orden-compra.entity';
import { DetalleOrdenCompraMongo, DetalleOrdenCompraDocument } from '../schemas/detalle-orden-compra.schema';
import { Types } from 'mongoose';

export class DetalleOrdenCompraMapper {
  static toDomain(detalleDoc: DetalleOrdenCompraDocument, ordenCompraId?: string): DetalleOrdenCompra {
    if (!detalleDoc) return null;

    return new DetalleOrdenCompra(
      detalleDoc._id.toString(),
      ordenCompraId || detalleDoc.ordenCompraId.toString(),
      detalleDoc.productoId?.toString(),
      detalleDoc.codigoProducto,
      detalleDoc.nombreProducto,
      detalleDoc.cantidad,
      detalleDoc.precioUnitario,
      detalleDoc.cantidadRecibida,
      detalleDoc.observaciones,
      (detalleDoc as any).createdAt || new Date(),
    );
  }

  static toPersistence(detalle: DetalleOrdenCompra, ordenCompraId: string): Partial<DetalleOrdenCompraMongo> {
    const doc: any = {
      ordenCompraId: new Types.ObjectId(ordenCompraId),
      codigoProducto: detalle.codigoProducto,
      nombreProducto: detalle.nombreProducto,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      cantidadRecibida: detalle.cantidadRecibida,
      observaciones: detalle.observaciones,
    };

    if (detalle.productoId) {
      doc.productoId = new Types.ObjectId(detalle.productoId);
    }

    if (detalle.id) {
      (doc as any)._id = new Types.ObjectId(detalle.id);
    }

    return doc;
  }
}


