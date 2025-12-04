import { OrdenCompra } from '../../../../domain/entities/orden-compra.entity';
import { OrdenCompraMongo, OrdenCompraDocument } from '../schemas/orden-compra.schema';
import { DetalleOrdenCompraMongo, DetalleOrdenCompraDocument } from '../schemas/detalle-orden-compra.schema';
import { DetalleOrdenCompraMapper } from './detalle-orden-compra.mapper';
import { EstadoOrdenCompra } from '../../../../domain/enums/estado-orden-compra.enum';
import { Types } from 'mongoose';

export class OrdenCompraMapper {
  static toDomain(
    ordenDoc: OrdenCompraDocument,
    detallesDocs: DetalleOrdenCompraDocument[],
  ): OrdenCompra {
    if (!ordenDoc) return null;

    const detalles = detallesDocs.map((det) =>
      DetalleOrdenCompraMapper.toDomain(det, ordenDoc._id.toString()),
    );

    return new OrdenCompra(
      ordenDoc._id.toString(),
      ordenDoc.numero,
      ordenDoc.proveedorId.toString(),
      ordenDoc.fecha,
      detalles,
      ordenDoc.estado as EstadoOrdenCompra,
      (ordenDoc as any).fechaEstimadaEntrega,
      ordenDoc.observaciones,
      ordenDoc.remitoId?.toString(),
      ordenDoc.facturaId?.toString(),
      (ordenDoc as any).createdAt || new Date(),
      (ordenDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(orden: OrdenCompra): {
    orden: Partial<OrdenCompraMongo>;
    detalles: Partial<DetalleOrdenCompraMongo>[];
  } {
    const ordenDoc: any = {
      numero: orden.numero,
      proveedorId: new Types.ObjectId(orden.proveedorId),
      fecha: orden.fecha,
      estado: orden.estado,
      fechaEstimadaEntrega: orden.fechaEstimadaEntrega,
      observaciones: orden.observaciones,
    };

    if (orden.remitoId) {
      ordenDoc.remitoId = new Types.ObjectId(orden.remitoId);
    }

    if (orden.facturaId) {
      ordenDoc.facturaId = new Types.ObjectId(orden.facturaId);
    }

    if (orden.id) {
      ordenDoc._id = new Types.ObjectId(orden.id);
    }

    const detalles = orden.detalles.map((det) =>
      DetalleOrdenCompraMapper.toPersistence(det, orden.id || ''),
    );

    return { orden: ordenDoc, detalles };
  }
}





