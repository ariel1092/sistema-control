import { MovimientoCuentaCorrienteCliente } from '../../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { Types } from 'mongoose';

export class MovimientoCuentaCorrienteClienteMapper {
  static toDomain(movimientoDoc: any): MovimientoCuentaCorrienteCliente {
    if (!movimientoDoc) return null;

    return new MovimientoCuentaCorrienteCliente(
      movimientoDoc._id.toString(),
      movimientoDoc.clienteId?.toString() || movimientoDoc.clienteId,
      movimientoDoc.tipo,
      movimientoDoc.fecha,
      movimientoDoc.monto,
      movimientoDoc.descripcion,
      movimientoDoc.documentoId?.toString(),
      movimientoDoc.documentoNumero,
      movimientoDoc.saldoAnterior,
      movimientoDoc.saldoActual,
      movimientoDoc.observaciones,
      movimientoDoc.usuarioId?.toString(),
      movimientoDoc.createdAt,
      movimientoDoc.updatedAt,
    );
  }

  static toPersistence(movimiento: MovimientoCuentaCorrienteCliente): any {
    const movimientoDoc: any = {
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
      movimientoDoc._id = Types.ObjectId.isValid(movimiento.id)
        ? new Types.ObjectId(movimiento.id)
        : movimiento.id;
    }

    if (movimiento.clienteId) {
      movimientoDoc.clienteId = Types.ObjectId.isValid(movimiento.clienteId)
        ? new Types.ObjectId(movimiento.clienteId)
        : movimiento.clienteId;
    }

    if (movimiento.usuarioId) {
      movimientoDoc.usuarioId = Types.ObjectId.isValid(movimiento.usuarioId)
        ? new Types.ObjectId(movimiento.usuarioId)
        : movimiento.usuarioId;
    }

    return movimientoDoc;
  }
}


