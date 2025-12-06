import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseOptionalDatePipe } from '../pipes/parse-optional-date.pipe';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateIncidenteUptimeUseCase } from '../../application/use-cases/incidente-uptime/create-incidente-uptime.use-case';
import { GetAllIncidentesUseCase } from '../../application/use-cases/incidente-uptime/get-all-incidentes.use-case';
import { GetIncidentesAbiertosUseCase } from '../../application/use-cases/incidente-uptime/get-incidentes-abiertos.use-case';
import { GetEstadisticasUptimeUseCase } from '../../application/use-cases/incidente-uptime/get-estadisticas-uptime.use-case';
import { CreateIncidenteUptimeDto } from '../../application/dtos/incidente-uptime/create-incidente-uptime.dto';

@ApiTags('Monitoreo')
@Controller('monitoreo')
export class IncidenteUptimeController {
  constructor(
    private readonly createIncidenteUseCase: CreateIncidenteUptimeUseCase,
    private readonly getAllIncidentesUseCase: GetAllIncidentesUseCase,
    private readonly getIncidentesAbiertosUseCase: GetIncidentesAbiertosUseCase,
    private readonly getEstadisticasUptimeUseCase: GetEstadisticasUptimeUseCase,
  ) {}

  @Post('incidentes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo incidente de uptime (webhook desde UptimeRobot u otros servicios)' })
  create(@Body() createDto: CreateIncidenteUptimeDto) {
    return this.createIncidenteUseCase.execute(createDto);
  }

  @Get('incidentes')
  @ApiOperation({ summary: 'Obtener todos los incidentes de uptime' })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String, description: 'Fecha de inicio (ISO string)' })
  @ApiQuery({ name: 'fechaFin', required: false, type: String, description: 'Fecha de fin (ISO string)' })
  @ApiQuery({ name: 'monitorName', required: false, type: String, description: 'Nombre del monitor' })
  findAll(
    @Query('fechaInicio', new ParseOptionalDatePipe()) fechaInicio?: Date,
    @Query('fechaFin', new ParseOptionalDatePipe()) fechaFin?: Date,
    @Query('monitorName') monitorName?: string,
  ) {
    return this.getAllIncidentesUseCase.execute(fechaInicio, fechaFin, monitorName);
  }

  @Get('incidentes/abiertos')
  @ApiOperation({ summary: 'Obtener todos los incidentes abiertos' })
  findAbiertos() {
    return this.getIncidentesAbiertosUseCase.execute();
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de uptime' })
  @ApiQuery({ name: 'fechaInicio', required: true, type: String, description: 'Fecha de inicio (ISO string)' })
  @ApiQuery({ name: 'fechaFin', required: true, type: String, description: 'Fecha de fin (ISO string)' })
  getEstadisticas(
    @Query('fechaInicio', new ParseOptionalDatePipe()) fechaInicio: Date,
    @Query('fechaFin', new ParseOptionalDatePipe()) fechaFin: Date,
  ) {
    if (!fechaInicio || !fechaFin) {
      throw new Error('Las fechas de inicio y fin son obligatorias para las estadísticas');
    }
    return this.getEstadisticasUptimeUseCase.execute(fechaInicio, fechaFin);
  }
}

