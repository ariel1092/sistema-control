import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateEmpleadoUseCase } from '../../application/use-cases/empleado/create-empleado.use-case';
import { GetAllEmpleadosUseCase } from '../../application/use-cases/empleado/get-all-empleados.use-case';
import { GetEmpleadoByIdUseCase } from '../../application/use-cases/empleado/get-empleado-by-id.use-case';
import { UpdateEmpleadoUseCase } from '../../application/use-cases/empleado/update-empleado.use-case';
import { RegistrarPagoUseCase } from '../../application/use-cases/empleado/registrar-pago.use-case';
import { RegistrarAdelantoUseCase } from '../../application/use-cases/empleado/registrar-adelanto.use-case';
import { RegistrarAsistenciaUseCase } from '../../application/use-cases/empleado/registrar-asistencia.use-case';
import { AgregarDocumentoUseCase } from '../../application/use-cases/empleado/agregar-documento.use-case';

@ApiTags('Empleados')
@Controller('empleados')
export class EmpleadoController {
  constructor(
    private readonly createEmpleadoUseCase: CreateEmpleadoUseCase,
    private readonly getAllEmpleadosUseCase: GetAllEmpleadosUseCase,
    private readonly getEmpleadoByIdUseCase: GetEmpleadoByIdUseCase,
    private readonly updateEmpleadoUseCase: UpdateEmpleadoUseCase,
    private readonly registrarPagoUseCase: RegistrarPagoUseCase,
    private readonly registrarAdelantoUseCase: RegistrarAdelantoUseCase,
    private readonly registrarAsistenciaUseCase: RegistrarAsistenciaUseCase,
    private readonly agregarDocumentoUseCase: AgregarDocumentoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los empleados' })
  findAll(@Query('incluirInactivos') incluirInactivos?: string) {
    const incluir = incluirInactivos === 'true';
    return this.getAllEmpleadosUseCase.execute(incluir);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por ID' })
  findOne(@Param('id') id: string) {
    return this.getEmpleadoByIdUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo empleado' })
  create(@Body() dto: any) {
    return this.createEmpleadoUseCase.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un empleado' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.updateEmpleadoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un empleado' })
  remove(@Param('id') id: string) {
    // TODO: Implementar DeleteEmpleadoUseCase
    return null;
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Registrar un pago a un empleado' })
  registrarPago(@Param('id') id: string, @Body() dto: any) {
    return this.registrarPagoUseCase.execute(id, dto);
  }

  @Post(':id/adelantos')
  @ApiOperation({ summary: 'Registrar un adelanto a un empleado' })
  registrarAdelanto(@Param('id') id: string, @Body() dto: any) {
    return this.registrarAdelantoUseCase.execute(id, dto);
  }

  @Post(':id/asistencias')
  @ApiOperation({ summary: 'Registrar asistencia de un empleado' })
  registrarAsistencia(@Param('id') id: string, @Body() dto: any) {
    return this.registrarAsistenciaUseCase.execute(id, dto);
  }

  @Post(':id/documentos')
  @ApiOperation({ summary: 'Agregar un documento a un empleado' })
  agregarDocumento(@Param('id') id: string, @Body() dto: any) {
    return this.agregarDocumentoUseCase.execute(id, dto);
  }
}
