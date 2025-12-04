import { RemitoProveedor } from '../../../../domain/entities/remito-proveedor.entity';
import { RemitoProveedorMongo, RemitoProveedorDocument } from '../schemas/remito-proveedor.schema';
import { DetalleRemitoMongo, DetalleRemitoDocument } from '../schemas/detalle-remito.schema';
import { DetalleRemitoMapper } from './detalle-remito.mapper';
import { Types } from 'mongoose';

export class RemitoProveedorMapper {
  static toDomain(
    remitoDoc: RemitoProveedorDocument,
    detallesDocs: DetalleRemitoDocument[],
  ): RemitoProveedor {
    if (!remitoDoc) return null;

    const detalles = detallesDocs.map((det) =>
      DetalleRemitoMapper.toDomain(det, remitoDoc._id.toString()),
    );

    return new RemitoProveedor(
      remitoDoc._id.toString(),
      remitoDoc.numero,
      remitoDoc.proveedorId.toString(),
      remitoDoc.fecha,
      detalles,
      remitoDoc.ordenCompraId?.toString(),
      remitoDoc.facturado,
      remitoDoc.facturaId?.toString(),
      remitoDoc.observaciones,
      (remitoDoc as any).createdAt || new Date(),
      (remitoDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(remito: RemitoProveedor): {
    remito: Partial<RemitoProveedorMongo>;
    detalles: Partial<DetalleRemitoMongo>[];
  } {
    const remitoDoc: any = {
      numero: remito.numero,
      proveedorId: new Types.ObjectId(remito.proveedorId),
      fecha: remito.fecha,
      facturado: remito.facturado,
      observaciones: remito.observaciones,
    };

    if (remito.ordenCompraId) {
      remitoDoc.ordenCompraId = new Types.ObjectId(remito.ordenCompraId);
    }

    if (remito.facturaId) {
      remitoDoc.facturaId = new Types.ObjectId(remito.facturaId);
    }

    if (remito.id) {
      remitoDoc._id = new Types.ObjectId(remito.id);
    }

    const detalles = remito.detalles.map((det) =>
      DetalleRemitoMapper.toPersistence(det, remito.id || ''),
    );

    return { remito: remitoDoc, detalles };
  }
}





