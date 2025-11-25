import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateEmpleadoUseCase } from '../../application/use-cases/empleado/create-empleado.use-case';
import { GetAllEmpleadosUseCase } from '../../application/use-cases/empleado/get-all-empleados.use-case';
import { GetEmpleadoByIdUseCase } from '../../application/use-cases/empleado/get-empleado-by-id.use-case';
import { UpdateEmpleadoUseCase } from '../../application/use-cases/empleado/update-empleado.use-case';
import { RegistrarPagoUseCase } from '../../application/use-cases/empleado/registrar-pago.use-case';
import { RegistrarAdelantoUseCase } from '../../application/use-cases/empleado/registrar-adelanto.use-case';
import { RegistrarAsistenciaUseCase } from '../../application/use-cases/empleado/registrar-asistencia.use-case';
import { AgregarDocumentoUseCase } from '../../application/use-cases/empleado/agregar-documento.use-case';
import { CreateEmpleadoDto } from '../../application/dtos/empleado/create-empleado.dto';
import { UpdateEmpleadoDto } from '../../application/dtos/empleado/update-empleado.dto';
import { RegistrarPagoDto } from '../../application/dtos/empleado/registrar-pago.dto';
import { RegistrarAdelantoDto } from '../../application/dtos/empleado/registrar-adelanto.dto';
import { RegistrarAsistenciaDto } from '../../application/dtos/empleado/registrar-asistencia.dto';
import { AgregarDocumentoDto } from '../../application/dtos/empleado/agregar-documento.dto';
import { EmpleadoResponseDto } from '../../application/dtos/empleado/empleado-response.dto';

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

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo empleado' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente', type: EmpleadoResponseDto })
  async create(@Body() createEmpleadoDto: CreateEmpleadoDto): Promise<EmpleadoResponseDto> {
    const empleado = await this.createEmpleadoUseCase.execute(createEmpleadoDto);
    return this.mapToResponse(empleado);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los empleados' })
  @ApiResponse({ status: 200, description: 'Lista de empleados', type: [EmpleadoResponseDto] })
  async findAll(@Query('activos') activos?: string): Promise<EmpleadoResponseDto[]> {
    const activosBool = activos === 'true' ? true : activos === 'false' ? false : undefined;
    const empleados = await this.getAllEmpleadosUseCase.execute(activosBool);
    return empleados.map((e) => this.mapToResponse(e));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un empleado por ID' })
  @ApiResponse({ status: 200, description: 'Empleado encontrado', type: EmpleadoResponseDto })
  async findOne(@Param('id') id: string): Promise<EmpleadoResponseDto> {
    const empleado = await this.getEmpleadoByIdUseCase.execute(id);
    return this.mapToResponse(empleado);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado exitosamente', type: EmpleadoResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateEmpleadoDto: UpdateEmpleadoDto,
  ): Promise<EmpleadoResponseDto> {
    const empleado = await this.updateEmpleadoUseCase.execute(id, updateEmpleadoDto);
    return this.mapToResponse(empleado);
  }

  @Post(':id/pagos')
  @ApiOperation({ summary: 'Registrar un pago a un empleado' })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente', type: EmpleadoResponseDto })
  async registrarPago(
    @Param('id') id: string,
    @Body() registrarPagoDto: RegistrarPagoDto,
  ): Promise<EmpleadoResponseDto> {
    const empleado = await this.registrarPagoUseCase.execute(id, registrarPagoDto);
    return this.mapToResponse(empleado);
  }

  @Post(':id/adelantos')
  @ApiOperation({ summary: 'Registrar un adelanto a un empleado' })
  @ApiResponse({ status: 201, description: 'Adelanto registrado exitosamente', type: EmpleadoResponseDto })
  async registrarAdelanto(
    @Param('id') id: string,
    @Body() registrarAdelantoDto: RegistrarAdelantoDto,
  ): Promise<EmpleadoResponseDto> {
    const empleado = await this.registrarAdelantoUseCase.execute(id, registrarAdelantoDto);
    return this.mapToResponse(empleado);
  }

  @Post(':id/asistencias')
  @ApiOperation({ summary: 'Registrar asistencia de un empleado' })
  @ApiResponse({ status: 201, description: 'Asistencia registrada exitosamente', type: EmpleadoResponseDto })
  async registrarAsistencia(
    @Param('id') id: string,
    @Body() registrarAsistenciaDto: RegistrarAsistenciaDto,
  ): Promise<EmpleadoResponseDto> {
    const empleado = await this.registrarAsistenciaUseCase.execute(id, registrarAsistenciaDto);
    return this.mapToResponse(empleado);
  }

  @Post(':id/documentos')
  @ApiOperation({ summary: 'Agregar un documento a un empleado' })
  @ApiResponse({ status: 201, description: 'Documento agregado exitosamente', type: EmpleadoResponseDto })
  async agregarDocumento(
    @Param('id') id: string,
    @Body() agregarDocumentoDto: AgregarDocumentoDto,
  ): Promise<EmpleadoResponseDto> {
    const empleado = await this.agregarDocumentoUseCase.execute(id, agregarDocumentoDto);
    return this.mapToResponse(empleado);
  }

  @Patch(':id/desactivar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado desactivado exitosamente', type: EmpleadoResponseDto })
  async desactivar(@Param('id') id: string): Promise<EmpleadoResponseDto> {
    const empleado = await this.getEmpleadoByIdUseCase.execute(id);
    empleado.desactivar();
    const empleadoRepo = await this.updateEmpleadoUseCase.execute(id, {});
    return this.mapToResponse(empleadoRepo);
  }

  @Patch(':id/activar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado activado exitosamente', type: EmpleadoResponseDto })
  async activar(@Param('id') id: string): Promise<EmpleadoResponseDto> {
    const empleado = await this.getEmpleadoByIdUseCase.execute(id);
    empleado.activar();
    const empleadoRepo = await this.updateEmpleadoUseCase.execute(id, {});
    return this.mapToResponse(empleadoRepo);
  }

  private mapToResponse(empleado: any): EmpleadoResponseDto {
    return {
      id: empleado.id,
      nombre: empleado.nombre,
      dni: empleado.dni,
      telefono: empleado.telefono,
      direccion: empleado.direccion,
      puesto: empleado.puesto,
      fechaIngreso: empleado.fechaIngreso,
      sueldoMensual: empleado.sueldoMensual,
      pagos: empleado.pagos || [],
      adelantos: empleado.adelantos || [],
      asistencias: empleado.asistencias || [],
      documentos: empleado.documentos || [],
      activo: empleado.activo,
      createdAt: empleado.createdAt,
      updatedAt: empleado.updatedAt,
    };
  }
}


