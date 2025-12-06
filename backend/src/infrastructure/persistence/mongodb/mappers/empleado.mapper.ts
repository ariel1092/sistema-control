import { Types } from 'mongoose';
import { Empleado, PagoEmpleado, AdelantoEmpleado, AsistenciaEmpleado, DocumentoEmpleado } from '../../../../domain/entities/empleado.entity';
import { EmpleadoMongo, PagoEmpleadoMongo, AdelantoEmpleadoMongo, AsistenciaEmpleadoMongo, DocumentoEmpleadoMongo } from '../schemas/empleado.schema';

export class EmpleadoMapper {
  static toDomain(doc: any): Empleado {
    if (!doc) return null;

    return Empleado.reconstruir({
      id: doc._id?.toString() || doc.id,
      nombre: doc.nombre,
      dni: doc.dni,
      telefono: doc.telefono,
      direccion: doc.direccion,
      puesto: doc.puesto,
      fechaIngreso: doc.fechaIngreso,
      sueldoMensual: doc.sueldoMensual,
      pagos: (doc.pagos || []).map((p: any) => PagoEmpleadoMapper.toDomain(p)),
      adelantos: (doc.adelantos || []).map((a: any) => AdelantoEmpleadoMapper.toDomain(a)),
      asistencias: (doc.asistencias || []).map((a: any) => AsistenciaEmpleadoMapper.toDomain(a)),
      documentos: (doc.documentos || []).map((d: any) => DocumentoEmpleadoMapper.toDomain(d)),
      activo: doc.activo !== undefined ? doc.activo : true,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(empleado: Empleado): Partial<EmpleadoMongo> {
    const doc: any = {
      nombre: empleado.nombre,
      dni: empleado.dni,
      telefono: empleado.telefono,
      direccion: empleado.direccion,
      puesto: empleado.puesto,
      fechaIngreso: empleado.fechaIngreso,
      sueldoMensual: empleado.sueldoMensual,
      pagos: empleado.pagos.map((p) => PagoEmpleadoMapper.toPersistence(p)),
      adelantos: empleado.adelantos.map((a) => AdelantoEmpleadoMapper.toPersistence(a)),
      asistencias: empleado.asistencias.map((a) => AsistenciaEmpleadoMapper.toPersistence(a)),
      documentos: empleado.documentos.map((d) => DocumentoEmpleadoMapper.toPersistence(d)),
      activo: empleado.activo,
    };

    if (empleado.id && Types.ObjectId.isValid(empleado.id)) {
      (doc as any)._id = new Types.ObjectId(empleado.id);
    }

    return doc;
  }
}

class PagoEmpleadoMapper {
  static toDomain(doc: any): PagoEmpleado {
    return {
      id: doc._id?.toString() || doc.id,
      mes: doc.mes,
      monto: doc.monto,
      fechaPago: doc.fechaPago,
      observaciones: doc.observaciones,
      createdAt: doc.createdAt,
    };
  }

  static toPersistence(pago: PagoEmpleado): Partial<PagoEmpleadoMongo> {
    const doc: any = {
      mes: pago.mes,
      monto: pago.monto,
      fechaPago: pago.fechaPago,
      observaciones: pago.observaciones,
    };

    if (pago.id && Types.ObjectId.isValid(pago.id)) {
      (doc as any)._id = new Types.ObjectId(pago.id);
    }

    return doc;
  }
}

class AdelantoEmpleadoMapper {
  static toDomain(doc: any): AdelantoEmpleado {
    return {
      id: doc._id?.toString() || doc.id,
      fecha: doc.fecha,
      monto: doc.monto,
      observaciones: doc.observaciones,
      mesAplicado: doc.mesAplicado,
      createdAt: doc.createdAt,
    };
  }

  static toPersistence(adelanto: AdelantoEmpleado): Partial<AdelantoEmpleadoMongo> {
    const doc: any = {
      fecha: adelanto.fecha,
      monto: adelanto.monto,
      observaciones: adelanto.observaciones,
      mesAplicado: adelanto.mesAplicado,
    };

    if (adelanto.id && Types.ObjectId.isValid(adelanto.id)) {
      (doc as any)._id = new Types.ObjectId(adelanto.id);
    }

    return doc;
  }
}

class AsistenciaEmpleadoMapper {
  static toDomain(doc: any): AsistenciaEmpleado {
    return {
      id: doc._id?.toString() || doc.id,
      fecha: doc.fecha,
      presente: doc.presente,
      observaciones: doc.observaciones,
      createdAt: doc.createdAt,
    };
  }

  static toPersistence(asistencia: AsistenciaEmpleado): Partial<AsistenciaEmpleadoMongo> {
    const doc: any = {
      fecha: asistencia.fecha,
      presente: asistencia.presente,
      observaciones: asistencia.observaciones,
    };

    if (asistencia.id && Types.ObjectId.isValid(asistencia.id)) {
      (doc as any)._id = new Types.ObjectId(asistencia.id);
    }

    return doc;
  }
}

class DocumentoEmpleadoMapper {
  static toDomain(doc: any): DocumentoEmpleado {
    return {
      id: doc._id?.toString() || doc.id,
      tipo: doc.tipo,
      nombre: doc.nombre,
      url: doc.url,
      fechaSubida: doc.fechaSubida,
      createdAt: doc.createdAt,
    };
  }

  static toPersistence(documento: DocumentoEmpleado): Partial<DocumentoEmpleadoMongo> {
    const doc: any = {
      tipo: documento.tipo,
      nombre: documento.nombre,
      url: documento.url,
      fechaSubida: documento.fechaSubida,
    };

    if (documento.id && Types.ObjectId.isValid(documento.id)) {
      (doc as any)._id = new Types.ObjectId(documento.id);
    }

    return doc;
  }
}









