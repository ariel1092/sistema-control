import { Injectable, Inject } from '@nestjs/common';
import { AuditoriaEvento } from '../../../domain/entities/auditoria-evento.entity';
import { IAuditoriaEventoRepository } from '../../ports/auditoria-evento.repository.interface';
import { TipoEventoAuditoria } from '../../../domain/enums/tipo-evento-auditoria.enum';

@Injectable()
export class RegistrarAuditoriaUseCase {
    constructor(
        @Inject('IAuditoriaEventoRepository')
        private readonly repository: IAuditoriaEventoRepository,
    ) { }

    async execute(params: {
        entidad: string;
        entidadId: string;
        evento: TipoEventoAuditoria;
        snapshot: any;
        usuarioId: string;
        ip?: string;
        userAgent?: string;
        razon?: string;
    }, options?: { session?: any }): Promise<void> {
        const session = options?.session;
        const evento = AuditoriaEvento.crear({
            entidad: params.entidad,
            entidadId: params.entidadId,
            evento: params.evento,
            snapshot: params.snapshot,
            metadatos: {
                usuarioId: params.usuarioId,
                ip: params.ip,
                userAgent: params.userAgent,
                razon: params.razon,
            },
        });



        await this.repository.save(evento, { session });
    }
}
