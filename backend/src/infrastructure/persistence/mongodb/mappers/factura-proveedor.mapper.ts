import { FacturaProveedor } from '../../../../domain/entities/factura-proveedor.entity';
import { FacturaProveedorMongo, FacturaProveedorDocument } from '../schemas/factura-proveedor.schema';
import { DetalleFacturaProveedorMongo, DetalleFacturaProveedorDocument } from '../schemas/detalle-factura-proveedor.schema';
import { DetalleFacturaProveedorMapper } from './detalle-factura-proveedor.mapper';
import { Types } from 'mongoose';

export class FacturaProveedorMapper {
  static toDomain(
    facturaDoc: FacturaProveedorDocument,
    detallesDocs: DetalleFacturaProveedorDocument[],
  ): FacturaProveedor {
    if (!facturaDoc) return null;

    const detalles = detallesDocs.map((det) =>
      DetalleFacturaProveedorMapper.toDomain(det, facturaDoc._id.toString()),
    );

    return new FacturaProveedor(
      facturaDoc._id.toString(),
      facturaDoc.numero,
      facturaDoc.proveedorId.toString(),
      facturaDoc.fecha,
      facturaDoc.fechaVencimiento,
      detalles,
      facturaDoc.remitoId?.toString(),
      facturaDoc.ordenCompraId?.toString(),
      facturaDoc.pagada,
      facturaDoc.montoPagado,
      facturaDoc.fechaPago,
      facturaDoc.observaciones,
      (facturaDoc as any).createdAt || new Date(),
      (facturaDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(factura: FacturaProveedor): {
    factura: Partial<FacturaProveedorMongo>;
    detalles: Partial<DetalleFacturaProveedorMongo>[];
  } {
    const facturaDoc: any = {
      numero: factura.numero,
      proveedorId: new Types.ObjectId(factura.proveedorId),
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      pagada: factura.pagada,
      montoPagado: factura.montoPagado,
      fechaPago: factura.fechaPago,
      observaciones: factura.observaciones,
    };

    if (factura.remitoId) {
      facturaDoc.remitoId = new Types.ObjectId(factura.remitoId);
    }

    if (factura.ordenCompraId) {
      facturaDoc.ordenCompraId = new Types.ObjectId(factura.ordenCompraId);
    }

    if (factura.id) {
      facturaDoc._id = new Types.ObjectId(factura.id);
    }

    const detalles = factura.detalles.map((det) =>
      DetalleFacturaProveedorMapper.toPersistence(det, factura.id || ''),
    );

    return { factura: facturaDoc, detalles };
  }
}


