import { Cliente } from '../../../../domain/entities/cliente.entity';
import { ClienteMongo } from '../schemas/cliente.schema';

export class ClienteMapper {
  static toDomain(clienteDoc: any): Cliente {
    if (!clienteDoc) return null;

    return new Cliente(
      clienteDoc._id.toString(),
      clienteDoc.nombre,
      clienteDoc.razonSocial,
      clienteDoc.dni,
      clienteDoc.telefono,
      clienteDoc.email,
      clienteDoc.direccion,
      clienteDoc.observaciones,
      clienteDoc.tieneCuentaCorriente,
      clienteDoc.saldoCuentaCorriente,
      clienteDoc.createdAt,
      clienteDoc.updatedAt,
    );
  }

  static toPersistence(cliente: Cliente): any {
    const doc: any = {
      nombre: cliente.nombre,
      razonSocial: cliente.razonSocial,
      dni: cliente.dni,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      observaciones: cliente.observaciones,
      tieneCuentaCorriente: cliente.tieneCuentaCorriente,
      saldoCuentaCorriente: cliente.saldoCuentaCorriente,
    };

    if (cliente.id) {
      (doc as any)._id = cliente.id;
    }

    return doc;
  }
}




