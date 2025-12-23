import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfiguracionController } from '../../presentation/controllers/configuracion.controller';
import { ConfiguracionRecargosMongo, ConfiguracionRecargosSchema } from '../../infrastructure/persistence/mongodb/schemas/configuracion-recargos.schema';
import { ConfiguracionRecargosRepository } from '../../infrastructure/persistence/mongodb/repositories/configuracion-recargos.repository';
import { GetRecargosConfigUseCase } from '../../application/use-cases/configuracion/get-recargos-config.use-case';
import { UpdateRecargosConfigUseCase } from '../../application/use-cases/configuracion/update-recargos-config.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConfiguracionRecargosMongo.name, schema: ConfiguracionRecargosSchema },
    ]),
  ],
  controllers: [ConfiguracionController],
  providers: [
    {
      provide: 'IConfiguracionRecargosRepository',
      useClass: ConfiguracionRecargosRepository,
    },
    GetRecargosConfigUseCase,
    UpdateRecargosConfigUseCase,
  ],
  exports: ['IConfiguracionRecargosRepository', GetRecargosConfigUseCase],
})
export class ConfiguracionModule {}




