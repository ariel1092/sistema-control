import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';

export enum CategoriaProveedor {
  FERRETERIA = 'FERRETERIA',
  PLOMERIA = 'PLOMERIA',
  ELECTRICIDAD = 'ELECTRICIDAD',
  CONSTRUCCION = 'CONSTRUCCION',
  PINTURAS = 'PINTURAS',
  HERRAMIENTAS = 'HERRAMIENTAS',
  SEGURIDAD = 'SEGURIDAD',
  JARDINERIA = 'JARDINERIA',
  OTROS = 'OTROS',
}

export enum FormaPagoHabitual {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  MERCADOPAGO = 'MERCADOPAGO',
  CUENTA_CORRIENTE = 'CUENTA_CORRIENTE',
  CHEQUE = 'CHEQUE',
}

export class CreateProveedorDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  razonSocial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cuit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domicilio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: CategoriaProveedor })
  @IsEnum(CategoriaProveedor)
  categoria: CategoriaProveedor;

  @ApiProperty({ required: false, type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productosProvee?: string[];

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  condicionesCompra?: string;

  @ApiProperty({ enum: FormaPagoHabitual })
  @IsEnum(FormaPagoHabitual)
  formaPagoHabitual: FormaPagoHabitual;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendedorAsignado?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plazoCuentaCorriente?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  margenGanancia?: number;
}
