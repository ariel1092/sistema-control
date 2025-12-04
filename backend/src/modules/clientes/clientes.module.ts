import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClienteController } from '../../presentation/controllers/cliente.controller';
import { ClienteRepository } from '../../infrastructure/persistence/mongodb/repositories/cliente.repository';
import { ClienteMongo, ClienteSchema } from '../../infrastructure/persistence/mongodb/schemas/cliente.schema';
import { CreateClienteUseCase } from '../../application/use-cases/cliente/create-cliente.use-case';
import { GetAllClientesUseCase } from '../../application/use-cases/cliente/get-all-clientes.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClienteMongo.name, schema: ClienteSchema }]),
  ],
  controllers: [ClienteController],
  providers: [
    {
      provide: 'IClienteRepository',
      useClass: ClienteRepository,
    },
    CreateClienteUseCase,
    GetAllClientesUseCase,
  ],
  exports: ['IClienteRepository'],
})
export class ClientesModule {}










