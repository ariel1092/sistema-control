import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidenteUptimeController } from '../../presentation/controllers/incidente-uptime.controller';
import { IncidenteUptimeRepository } from '../../infrastructure/persistence/mongodb/repositories/incidente-uptime.repository';
import { IncidenteUptimeMongo, IncidenteUptimeSchema } from '../../infrastructure/persistence/mongodb/schemas/incidente-uptime.schema';
import { CreateIncidenteUptimeUseCase } from '../../application/use-cases/incidente-uptime/create-incidente-uptime.use-case';
import { GetAllIncidentesUseCase } from '../../application/use-cases/incidente-uptime/get-all-incidentes.use-case';
import { GetIncidentesAbiertosUseCase } from '../../application/use-cases/incidente-uptime/get-incidentes-abiertos.use-case';
import { GetEstadisticasUptimeUseCase } from '../../application/use-cases/incidente-uptime/get-estadisticas-uptime.use-case';
import { ParseOptionalDatePipe } from '../../presentation/pipes/parse-optional-date.pipe';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: IncidenteUptimeMongo.name, schema: IncidenteUptimeSchema }]),
  ],
  controllers: [IncidenteUptimeController],
  providers: [
    {
      provide: 'IIncidenteUptimeRepository',
      useClass: IncidenteUptimeRepository,
    },
    CreateIncidenteUptimeUseCase,
    GetAllIncidentesUseCase,
    GetIncidentesAbiertosUseCase,
    GetEstadisticasUptimeUseCase,
    ParseOptionalDatePipe,
  ],
  exports: ['IIncidenteUptimeRepository'],
})
export class MonitoreoModule {}

