import { IsOptional, IsString } from 'class-validator';

export class GetPreciosProveedoresParamsDto {
  @IsString()
  productoId: string;
}

/**
 * Query DTO reservado para extensiones futuras (orden/limit, etc).
 * Requisito: usar Query DTO aunque hoy no se necesite ningún parámetro.
 */
export class GetPreciosProveedoresQueryDto {
  @IsOptional()
  @IsString()
  _?: string;
}


