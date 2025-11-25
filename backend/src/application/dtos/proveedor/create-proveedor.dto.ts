import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, MaxLength } from 'class-validator';
import { CategoriaProveedor } from '../../../domain/enums/categoria-proveedor.enum';
import { FormaPagoProveedor } from '../../../domain/enums/forma-pago-proveedor.enum';

export class CreateProveedorDto {
  @ApiProperty({ description: 'Nombre del proveedor', example: 'Acme Ferretería' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Razón social', required: false, example: 'Acme Ferretería S.A.' })
  @IsOptional()
  @IsString()
  razonSocial?: string;

  @ApiProperty({ description: 'CUIT', required: false, example: '20-12345678-9' })
  @IsOptional()
  @IsString()
  cuit?: string;

  @ApiProperty({ description: 'Domicilio', required: false })
  @IsOptional()
  @IsString()
  domicilio?: string;

  @ApiProperty({ description: 'Teléfono', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Categoría del proveedor', enum: CategoriaProveedor, default: CategoriaProveedor.OTROS })
  @IsEnum(CategoriaProveedor)
  categoria: CategoriaProveedor;

  @ApiProperty({ description: 'Lista de productos que provee', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productosProvee?: string[];

  @ApiProperty({ description: 'Condiciones de compra', required: false, example: '30/60 días' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  condicionesCompra?: string;

  @ApiProperty({ description: 'Forma de pago habitual', enum: FormaPagoProveedor, default: FormaPagoProveedor.CUENTA_CORRIENTE })
  @IsEnum(FormaPagoProveedor)
  formaPagoHabitual: FormaPagoProveedor;

  @ApiProperty({ description: 'Vendedor asignado', required: false })
  @IsOptional()
  @IsString()
  vendedorAsignado?: string;

  @ApiProperty({ description: 'Activo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}


