import { Producto } from '../../../../domain/entities/producto.entity';
import { ProductoMongo } from '../schemas/producto.schema';
import { Types } from 'mongoose';

export class ProductoMapper {
  static toDomain(productoDoc: any): Producto {
    if (!productoDoc) return null;

    // Extraer ID de manera segura
    const id = productoDoc._id 
      ? (productoDoc._id.toString ? productoDoc._id.toString() : String(productoDoc._id))
      : (productoDoc.id ? String(productoDoc.id) : undefined);

    if (!id) {
      throw new Error('ProductoMapper: No se pudo extraer el ID del documento');
    }

    return new Producto(
      id,
      productoDoc.codigo,
      productoDoc.nombre,
      productoDoc.categoria,
      productoDoc.proveedorId ? productoDoc.proveedorId.toString() : undefined,
      productoDoc.precioVenta,
      productoDoc.stockActual,
      productoDoc.stockMinimo,
      productoDoc.unidadMedida,
      productoDoc.activo,
      productoDoc.descuento || 0,
      productoDoc.iva !== undefined ? productoDoc.iva : 21,
      productoDoc.descripcion,
      productoDoc.marca,
      productoDoc.precioCosto,
      productoDoc.codigoBarras,
      productoDoc.createdAt,
      productoDoc.updatedAt,
    );
  }

  static toPersistence(producto: Producto): any {
    const doc: any = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      proveedorId: producto.proveedorId && Types.ObjectId.isValid(producto.proveedorId)
        ? new Types.ObjectId(producto.proveedorId)
        : undefined,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      unidadMedida: producto.unidadMedida,
      activo: producto.activo,
      descuento: producto.descuento,
      iva: producto.iva,
      descripcion: producto.descripcion,
      marca: producto.marca,
      precioCosto: producto.precioCosto,
      codigoBarras: producto.codigoBarras,
    };

    if (producto.id) {
      (doc as any)._id = new Types.ObjectId(producto.id);
    }

    return doc;
  }
}

