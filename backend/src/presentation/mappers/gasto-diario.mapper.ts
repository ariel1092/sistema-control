import { GastoDiario } from '../../domain/entities/gasto-diario.entity';
import { GastoDiarioResponseDto } from '../../application/dtos/gasto-diario/gasto-diario-response.dto';

export class GastoDiarioMapper {
  static toResponseDto(gasto: GastoDiario): GastoDiarioResponseDto {
    return {
      id: gasto.id!,
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      monto: gasto.monto,
      descripcion: gasto.descripcion,
      empleadoNombre: gasto.empleadoNombre,
      metodoPago: gasto.metodoPago,
      observaciones: gasto.observaciones,
      createdAt: gasto.createdAt,
      updatedAt: gasto.updatedAt,
    };
  }
}









