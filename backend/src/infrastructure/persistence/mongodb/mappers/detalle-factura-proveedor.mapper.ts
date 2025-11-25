import { DetalleFacturaProveedor } from '../../../../domain/entities/detalle-factura-proveedor.entity';
import { DetalleFacturaProveedorMongo, DetalleFacturaProveedorDocument } from '../schemas/detalle-factura-proveedor.schema';
import { Types } from 'mongoose';

export class DetalleFacturaProveedorMapper {
  static toDomain(detalleDoc: DetalleFacturaProveedorDocument, facturaId?: string): DetalleFacturaProveedor {
    if (!detalleDoc) return null;

    return new DetalleFacturaProveedor(
      detalleDoc._id.toString(),
      facturaId || detalleDoc.facturaId.toString(),
      detalleDoc.productoId?.toString(),
      detalleDoc.codigoProducto,
      detalleDoc.nombreProducto,
      detalleDoc.cantidad,
      detalleDoc.precioUnitario,
      detalleDoc.descuento,
      detalleDoc.iva,
      detalleDoc.observaciones,
      (detalleDoc as any).createdAt || new Date(),
    );
  }

  static toPersistence(detalle: DetalleFacturaProveedor, facturaId: string): Partial<DetalleFacturaProveedorMongo> {
    const doc: any = {
      facturaId: new Types.ObjectId(facturaId),
      codigoProducto: detalle.codigoProducto,
      nombreProducto: detalle.nombreProducto,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      descuento: detalle.descuento,
      iva: detalle.iva,
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


