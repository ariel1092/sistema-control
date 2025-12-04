import { FacturaProveedor } from '../../../../domain/entities/factura-proveedor.entity';
import { DetalleFacturaProveedor } from '../../../../domain/entities/detalle-factura-proveedor.entity';
import { FacturaProveedorMongo } from '../schemas/factura-proveedor.schema';
import { DetalleFacturaProveedorMongo } from '../schemas/detalle-factura-proveedor.schema';
import { Types } from 'mongoose';

export class FacturaProveedorMapper {
  static toDomain(
    facturaDoc: any,
    detallesDocs: any[] = [],
  ): FacturaProveedor {
    if (!facturaDoc) return null;

    const detalles = detallesDocs.map((det) =>
      new DetalleFacturaProveedor(
        det._id?.toString(),
        facturaDoc._id.toString(),
        det.codigoProducto,
        det.nombreProducto,
        det.cantidad,
        det.precioUnitario,
        det.descuento || 0,
        det.iva || 0,
        det.productoId?.toString(),
        det.observaciones,
        det.createdAt,
      ),
    );

    const factura = new FacturaProveedor(
      facturaDoc._id.toString(),
      facturaDoc.numero,
      facturaDoc.proveedorId?.toString() || facturaDoc.proveedorId,
      facturaDoc.fecha,
      facturaDoc.fechaVencimiento,
      detalles,
      facturaDoc.remitoId?.toString(),
      facturaDoc.ordenCompraId?.toString(),
      facturaDoc.observaciones,
      facturaDoc.createdAt,
      facturaDoc.updatedAt,
    );

    factura.montoPagado = facturaDoc.montoPagado || 0;

    return factura;
  }

  static toPersistence(factura: FacturaProveedor): {
    factura: any;
    detalles: any[];
  } {
    const facturaDoc: any = {
      numero: factura.numero,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      montoPagado: factura.montoPagado,
      observaciones: factura.observaciones,
    };

    if (factura.id) {
      facturaDoc._id = Types.ObjectId.isValid(factura.id)
        ? new Types.ObjectId(factura.id)
        : factura.id;
    }

    if (factura.proveedorId) {
      facturaDoc.proveedorId = Types.ObjectId.isValid(factura.proveedorId)
        ? new Types.ObjectId(factura.proveedorId)
        : factura.proveedorId;
    }

    if (factura.remitoId) {
      facturaDoc.remitoId = Types.ObjectId.isValid(factura.remitoId)
        ? new Types.ObjectId(factura.remitoId)
        : factura.remitoId;
    }

    if (factura.ordenCompraId) {
      facturaDoc.ordenCompraId = Types.ObjectId.isValid(factura.ordenCompraId)
        ? new Types.ObjectId(factura.ordenCompraId)
        : factura.ordenCompraId;
    }

    const detalles = factura.detalles.map((det) => {
      const detDoc: any = {
        codigoProducto: det.codigoProducto,
        nombreProducto: det.nombreProducto,
        cantidad: det.cantidad,
        precioUnitario: det.precioUnitario,
        descuento: det.descuento,
        iva: det.iva,
        observaciones: det.observaciones,
      };

      if (det.id) {
        detDoc._id = Types.ObjectId.isValid(det.id)
          ? new Types.ObjectId(det.id)
          : det.id;
      }

      if (factura.id) {
        detDoc.facturaId = Types.ObjectId.isValid(factura.id)
          ? new Types.ObjectId(factura.id)
          : factura.id;
      }

      if (det.productoId) {
        detDoc.productoId = Types.ObjectId.isValid(det.productoId)
          ? new Types.ObjectId(det.productoId)
          : det.productoId;
      }

      return detDoc;
    });

    return { factura: facturaDoc, detalles };
  }
}
