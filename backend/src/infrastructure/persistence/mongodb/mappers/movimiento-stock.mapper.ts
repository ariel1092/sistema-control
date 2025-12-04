import { MovimientoStock } from '../../../../domain/entities/movimiento-stock.entity';
import { MovimientoStockMongo } from '../schemas/movimiento-stock.schema';
import { Types } from 'mongoose';
import { TipoMovimientoStock } from '../../../../domain/enums/tipo-movimiento-stock.enum';

export class MovimientoStockMapper {
  static toDomain(raw: any): MovimientoStock {
    if (!raw) return null;
    return new MovimientoStock(
      raw._id.toString(),
      raw.productoId.toString(),
      raw.tipo as TipoMovimientoStock,
      raw.cantidad,
      raw.descripcion,
      raw.usuarioId.toString(),
      raw.ventaId ? raw.ventaId.toString() : undefined,
      raw.createdAt,
    );
  }

  static toPersistence(movimiento: MovimientoStock): any {
    const doc: any = {
      productoId: new Types.ObjectId(movimiento.productoId),
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      descripcion: movimiento.descripcion,
      usuarioId: new Types.ObjectId(movimiento.usuarioId),
    };
    if (movimiento.ventaId) {
      doc.ventaId = new Types.ObjectId(movimiento.ventaId);
    }
    if (movimiento.id) {
      doc._id = new Types.ObjectId(movimiento.id);
    }
    return doc;
  }
}
