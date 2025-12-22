import { Types } from 'mongoose';
import { MovimientoCaja, OrigenMovimientoCaja, TipoMovimientoCaja } from '../../../../domain/entities/movimiento-caja.entity';
import { MovimientoCajaMongo } from '../schemas/movimiento-caja.schema';

export class MovimientoCajaMapper {
  static toDomain(movimientoDoc: any): MovimientoCaja {
    if (!movimientoDoc) return null;

    return new MovimientoCaja(
      movimientoDoc._id.toString(),
      movimientoDoc.cierreCajaId?.toString() || movimientoDoc.cierreCajaId,
      movimientoDoc.tipo as TipoMovimientoCaja,
      movimientoDoc.monto,
      movimientoDoc.motivo,
      movimientoDoc.usuarioId?.toString() || movimientoDoc.usuarioId,
      (movimientoDoc.origen || OrigenMovimientoCaja.MANUAL) as OrigenMovimientoCaja,
      movimientoDoc.metodoPago,
      movimientoDoc.referencia,
      movimientoDoc.cuentaBancaria,
      movimientoDoc.recargo,
      movimientoDoc.ventaId,
      movimientoDoc.ventaNumero,
      movimientoDoc.comprobanteFiscalId,
      movimientoDoc.createdAt,
    );
  }

  static toPersistence(movimiento: MovimientoCaja): any {
    const doc: any = {
      tipo: movimiento.tipo,
      monto: movimiento.monto,
      motivo: movimiento.motivo,
      origen: movimiento.origen,
      metodoPago: movimiento.metodoPago,
      referencia: movimiento.referencia,
      cuentaBancaria: movimiento.cuentaBancaria,
      recargo: movimiento.recargo,
      ventaId: movimiento.ventaId,
      ventaNumero: movimiento.ventaNumero,
      comprobanteFiscalId: movimiento.comprobanteFiscalId,
    };

    if (movimiento.id) {
      (doc as any)._id = movimiento.id;
    }

    if (movimiento.cierreCajaId) {
      doc.cierreCajaId = Types.ObjectId.isValid(movimiento.cierreCajaId)
        ? new Types.ObjectId(movimiento.cierreCajaId)
        : movimiento.cierreCajaId;
    }

    if (movimiento.usuarioId) {
      doc.usuarioId = Types.ObjectId.isValid(movimiento.usuarioId)
        ? new Types.ObjectId(movimiento.usuarioId)
        : movimiento.usuarioId;
    }

    return doc;
  }
}

