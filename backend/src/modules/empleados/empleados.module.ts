import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmpleadoController } from '../../presentation/controllers/empleado.controller';
import { CreateEmpleadoUseCase } from '../../application/use-cases/empleado/create-empleado.use-case';
import { GetAllEmpleadosUseCase } from '../../application/use-cases/empleado/get-all-empleados.use-case';
import { GetEmpleadoByIdUseCase } from '../../application/use-cases/empleado/get-empleado-by-id.use-case';
import { UpdateEmpleadoUseCase } from '../../application/use-cases/empleado/update-empleado.use-case';
import { RegistrarPagoUseCase } from '../../application/use-cases/empleado/registrar-pago.use-case';
import { RegistrarAdelantoUseCase } from '../../application/use-cases/empleado/registrar-adelanto.use-case';
import { RegistrarAsistenciaUseCase } from '../../application/use-cases/empleado/registrar-asistencia.use-case';
import { AgregarDocumentoUseCase } from '../../application/use-cases/empleado/agregar-documento.use-case';
import { EmpleadoRepository } from '../../infrastructure/persistence/mongodb/repositories/empleado.repository';
import { EmpleadoMongo, EmpleadoSchema } from '../../infrastructure/persistence/mongodb/schemas/empleado.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmpleadoMongo.name, schema: EmpleadoSchema },
    ]),
  ],
  controllers: [EmpleadoController],
  providers: [
    {
      provide: 'IEmpleadoRepository',
      useClass: EmpleadoRepository,
    },
    CreateEmpleadoUseCase,
    GetAllEmpleadosUseCase,
    GetEmpleadoByIdUseCase,
    UpdateEmpleadoUseCase,
    RegistrarPagoUseCase,
    RegistrarAdelantoUseCase,
    RegistrarAsistenciaUseCase,
    AgregarDocumentoUseCase,
  ],
  exports: [
    'IEmpleadoRepository',
    CreateEmpleadoUseCase,
    GetAllEmpleadosUseCase,
    GetEmpleadoByIdUseCase,
  ],
})
export class EmpleadosModule {}









