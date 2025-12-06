import { ApiProperty } from '@nestjs/swagger';
import { PuestoEmpleado, PagoEmpleado, AdelantoEmpleado, AsistenciaEmpleado, DocumentoEmpleado } from '../../../domain/entities/empleado.entity';

export class PagoEmpleadoResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  mes: string;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  fechaPago: Date;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class AdelantoEmpleadoResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  monto: number;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  mesAplicado: string;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class AsistenciaEmpleadoResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  presente: boolean;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class DocumentoEmpleadoResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty({ enum: ['DNI', 'CONTRATO'] })
  tipo: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  fechaSubida: Date;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class EmpleadoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  dni: string;

  @ApiProperty({ required: false })
  telefono?: string;

  @ApiProperty({ required: false })
  direccion?: string;

  @ApiProperty({ enum: PuestoEmpleado })
  puesto: PuestoEmpleado;

  @ApiProperty()
  fechaIngreso: Date;

  @ApiProperty()
  sueldoMensual: number;

  @ApiProperty({ type: [PagoEmpleadoResponseDto] })
  pagos: PagoEmpleadoResponseDto[];

  @ApiProperty({ type: [AdelantoEmpleadoResponseDto] })
  adelantos: AdelantoEmpleadoResponseDto[];

  @ApiProperty({ type: [AsistenciaEmpleadoResponseDto] })
  asistencias: AsistenciaEmpleadoResponseDto[];

  @ApiProperty({ type: [DocumentoEmpleadoResponseDto] })
  documentos: DocumentoEmpleadoResponseDto[];

  @ApiProperty()
  activo: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;
}









