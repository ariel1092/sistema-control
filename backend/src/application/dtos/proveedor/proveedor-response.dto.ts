import { ApiProperty } from '@nestjs/swagger';
import { CategoriaProveedor } from '../../../domain/enums/categoria-proveedor.enum';
import { FormaPagoProveedor } from '../../../domain/enums/forma-pago-proveedor.enum';

export class ProveedorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ required: false })
  razonSocial?: string;

  @ApiProperty({ required: false })
  cuit?: string;

  @ApiProperty({ required: false })
  domicilio?: string;

  @ApiProperty({ required: false })
  telefono?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ enum: CategoriaProveedor })
  categoria: CategoriaProveedor;

  @ApiProperty({ type: [String] })
  productosProvee: string[];

  @ApiProperty()
  condicionesCompra: string;

  @ApiProperty({ enum: FormaPagoProveedor })
  formaPagoHabitual: FormaPagoProveedor;

  @ApiProperty({ required: false })
  vendedorAsignado?: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty({ required: false })
  observaciones?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}


