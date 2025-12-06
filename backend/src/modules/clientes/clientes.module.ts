import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClienteController } from '../../presentation/controllers/cliente.controller';
import { ClienteRepository } from '../../infrastructure/persistence/mongodb/repositories/cliente.repository';
import { ClienteMongo, ClienteSchema } from '../../infrastructure/persistence/mongodb/schemas/cliente.schema';
import { FacturaClienteMongo, FacturaClienteSchema } from '../../infrastructure/persistence/mongodb/schemas/factura-cliente.schema';
import { MovimientoCuentaCorrienteClienteMongo, MovimientoCuentaCorrienteClienteSchema } from '../../infrastructure/persistence/mongodb/schemas/movimiento-cuenta-corriente-cliente.schema';
import { FacturaClienteRepository } from '../../infrastructure/persistence/mongodb/repositories/factura-cliente.repository';
import { MovimientoCuentaCorrienteClienteRepository } from '../../infrastructure/persistence/mongodb/repositories/movimiento-cuenta-corriente-cliente.repository';
import { CreateClienteUseCase } from '../../application/use-cases/cliente/create-cliente.use-case';
import { GetAllClientesUseCase } from '../../application/use-cases/cliente/get-all-clientes.use-case';
import { CreateFacturaClienteUseCase } from '../../application/use-cases/cliente/create-factura-cliente.use-case';
import { GetFacturasClienteUseCase } from '../../application/use-cases/cliente/get-facturas-cliente.use-case';
import { RegistrarPagoClienteUseCase } from '../../application/use-cases/cliente/registrar-pago-cliente.use-case';
import { RegistrarPagoDirectoClienteUseCase } from '../../application/use-cases/cliente/registrar-pago-directo-cliente.use-case';
import { GetCuentaCorrienteClienteUseCase } from '../../application/use-cases/cliente/get-cuenta-corriente-cliente.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClienteMongo.name, schema: ClienteSchema },
      { name: FacturaClienteMongo.name, schema: FacturaClienteSchema },
      { name: MovimientoCuentaCorrienteClienteMongo.name, schema: MovimientoCuentaCorrienteClienteSchema },
    ]),
  ],
  controllers: [ClienteController],
  providers: [
    {
      provide: 'IClienteRepository',
      useClass: ClienteRepository,
    },
    {
      provide: 'IFacturaClienteRepository',
      useClass: FacturaClienteRepository,
    },
    {
      provide: 'IMovimientoCuentaCorrienteClienteRepository',
      useClass: MovimientoCuentaCorrienteClienteRepository,
    },
    CreateClienteUseCase,
    GetAllClientesUseCase,
    CreateFacturaClienteUseCase,
    GetFacturasClienteUseCase,
    RegistrarPagoClienteUseCase,
    RegistrarPagoDirectoClienteUseCase,
    GetCuentaCorrienteClienteUseCase,
  ],
  exports: ['IClienteRepository', 'IFacturaClienteRepository', 'IMovimientoCuentaCorrienteClienteRepository'],
})
export class ClientesModule {}











