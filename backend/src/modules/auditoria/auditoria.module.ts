import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditoriaEventoMongo, AuditoriaEventoSchema } from '../../infrastructure/persistence/mongodb/schemas/auditoria-evento.schema';
import { AuditoriaEventoRepository } from '../../infrastructure/persistence/mongodb/repositories/auditoria-evento.repository';
import { RegistrarAuditoriaUseCase } from '../../application/use-cases/auditoria/registrar-auditoria.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuditoriaEventoMongo.name, schema: AuditoriaEventoSchema },
        ]),
    ],
    providers: [
        {
            provide: 'IAuditoriaEventoRepository',
            useClass: AuditoriaEventoRepository,
        },
        RegistrarAuditoriaUseCase,
    ],
    exports: [RegistrarAuditoriaUseCase, 'IAuditoriaEventoRepository'],
})
export class AuditoriaModule { }
