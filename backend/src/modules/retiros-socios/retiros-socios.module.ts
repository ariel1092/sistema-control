import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { RetiroSocioController } from '../../presentation/controllers/retiro-socio.controller';
import { RetiroSocioRepository } from '../../infrastructure/persistence/mongodb/repositories/retiro-socio.repository';
import { CreateRetiroSocioUseCase } from '../../application/use-cases/retiro-socio/create-retiro-socio.use-case';
import { GetRetirosSocioUseCase } from '../../application/use-cases/retiro-socio/get-retiros-socio.use-case';
import { RetiroSocioMongo, RetiroSocioSchema } from '../../infrastructure/persistence/mongodb/schemas/retiro-socio.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: RetiroSocioMongo.name, schema: RetiroSocioSchema }]),
  ],
  controllers: [RetiroSocioController],
  providers: [
    {
      provide: 'IRetiroSocioRepository',
      useClass: RetiroSocioRepository,
    },
    CreateRetiroSocioUseCase,
    GetRetirosSocioUseCase,
  ],
  exports: ['IRetiroSocioRepository'],
})
export class RetirosSociosModule {}








