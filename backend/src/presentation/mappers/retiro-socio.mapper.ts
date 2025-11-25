import { RetiroSocio } from '../../domain/entities/retiro-socio.entity';
import { RetiroSocioResponseDto } from '../../application/dtos/retiro-socio/retiro-socio-response.dto';

export class RetiroSocioMapper {
  static toResponseDto(retiro: RetiroSocio): RetiroSocioResponseDto {
    return {
      id: retiro.id!,
      fecha: retiro.fecha,
      cuentaBancaria: retiro.cuentaBancaria,
      monto: retiro.monto,
      descripcion: retiro.descripcion,
      observaciones: retiro.observaciones,
      createdAt: retiro.createdAt,
      updatedAt: retiro.updatedAt,
    };
  }
}


