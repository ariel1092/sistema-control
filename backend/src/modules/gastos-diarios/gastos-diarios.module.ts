import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { GastoDiarioController } from '../../presentation/controllers/gasto-diario.controller';
import { GastoDiarioRepository } from '../../infrastructure/persistence/mongodb/repositories/gasto-diario.repository';
import { CreateGastoDiarioUseCase } from '../../application/use-cases/gasto-diario/create-gasto-diario.use-case';
import { GetGastosDiariosUseCase } from '../../application/use-cases/gasto-diario/get-gastos-diarios.use-case';
import { GetResumenGastosUseCase } from '../../application/use-cases/gasto-diario/get-resumen-gastos.use-case';
import { GastoDiarioMongo, GastoDiarioSchema } from '../../infrastructure/persistence/mongodb/schemas/gasto-diario.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: GastoDiarioMongo.name, schema: GastoDiarioSchema }]),
  ],
  controllers: [GastoDiarioController],
  providers: [
    {
      provide: 'IGastoDiarioRepository',
      useClass: GastoDiarioRepository,
    },
    CreateGastoDiarioUseCase,
    GetGastosDiariosUseCase,
    GetResumenGastosUseCase,
  ],
  exports: ['IGastoDiarioRepository'],
})
export class GastosDiariosModule {}









