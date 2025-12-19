import { TipoEventoAuditoria } from '../enums/tipo-evento-auditoria.enum';
import * as crypto from 'crypto';

export class AuditoriaEvento {
  constructor(
    public readonly id: string | undefined,
    public readonly entidad: string,
    public readonly entidadId: string,
    public readonly evento: TipoEventoAuditoria,
    public readonly snapshot: any,
    public readonly metadatos: any,
    public readonly hashIntegridad?: string,
    public readonly createdAt: Date = new Date(),
  ) { }

  static crear(params: {
    entidad: string;
    entidadId: string;
    evento: TipoEventoAuditoria;
    snapshot: any;
    metadatos: any;
  }): AuditoriaEvento {

    // Generar hash de integridad SHA-256
    // Concatenamos datos críticos para asegurar inmutabilidad
    const timestamp = new Date().toISOString();
    const dataToHash = JSON.stringify({
      entidad: params.entidad,
      entidadId: params.entidadId,
      evento: params.evento,
      snapshot: params.snapshot,
      usuarioId: params.metadatos.usuarioId,
      timestamp,
    });

    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return new AuditoriaEvento(
      undefined,
      params.entidad,
      params.entidadId,
      params.evento,
      params.snapshot,
      params.metadatos,
      hash,
      new Date(timestamp),
    );
  }
}


