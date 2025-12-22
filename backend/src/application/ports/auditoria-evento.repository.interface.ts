import { AuditoriaEvento } from '../../domain/entities/auditoria-evento.entity';

export interface IAuditoriaEventoRepository {
  save(evento: AuditoriaEvento, options?: { session?: any }): Promise<AuditoriaEvento>;
  findByEntidad(entidad: string, entidadId: string): Promise<AuditoriaEvento[]>;
}






