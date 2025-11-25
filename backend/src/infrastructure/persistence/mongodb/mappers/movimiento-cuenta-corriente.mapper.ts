import { MovimientoCuentaCorriente } from '../../../../domain/entities/movimiento-cuenta-corriente.entity';
import { MovimientoCuentaCorrienteMongo, MovimientoCuentaCorrienteDocument } from '../schemas/movimiento-cuenta-corriente.schema';
import { TipoMovimientoCC } from '../../../../domain/enums/tipo-movimiento-cc.enum';
import { Types } from 'mongoose';

export class MovimientoCuentaCorrienteMapper {
  static toDomain(movimientoDoc: MovimientoCuentaCorrienteDocument): MovimientoCuentaCorriente {
    if (!movimientoDoc) return null;

    return new MovimientoCuentaCorriente(
      movimientoDoc._id.toString(),
      movimientoDoc.proveedorId.toString(),
      movimientoDoc.tipo as TipoMovimientoCC,
      movimientoDoc.fecha,
      movimientoDoc.monto,
      movimientoDoc.descripcion,
      movimientoDoc.documentoId,
      movimientoDoc.documentoNumero,
      movimientoDoc.saldoAnterior,
      movimientoDoc.saldoActual,
      movimientoDoc.observaciones,
      (movimientoDoc as any).createdAt || new Date(),
      (movimientoDoc as any).updatedAt || new Date(),
    );
  }

  static toPersistence(movimiento: MovimientoCuentaCorriente): Partial<MovimientoCuentaCorrienteMongo> {
    const doc: any = {
      proveedorId: new Types.ObjectId(movimiento.proveedorId),
      tipo: movimiento.tipo,
      fecha: movimiento.fecha,
      monto: movimiento.monto,
      descripcion: movimiento.descripcion,
      documentoId: movimiento.documentoId,
      documentoNumero: movimiento.documentoNumero,
      saldoAnterior: movimiento.saldoAnterior,
      saldoActual: movimiento.saldoActual,
      observaciones: movimiento.observaciones,
    };

    if (movimiento.id) {
      (doc as any)._id = new Types.ObjectId(movimiento.id);
    }

    return doc;
  }
}


