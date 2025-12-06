import { Injectable, Inject } from '@nestjs/common';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';
import { CreateGastoDiarioDto } from '../../dtos/gasto-diario/create-gasto-diario.dto';
import { GastoDiario } from '../../../domain/entities/gasto-diario.entity';

@Injectable()
export class CreateGastoDiarioUseCase {
  constructor(
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
  ) {}

  async execute(dto: CreateGastoDiarioDto): Promise<GastoDiario> {
    const gasto = GastoDiario.crear({
      fecha: new Date(dto.fecha),
      categoria: dto.categoria,
      monto: dto.monto,
      descripcion: dto.descripcion,
      empleadoNombre: dto.empleadoNombre,
      metodoPago: dto.metodoPago,
      observaciones: dto.observaciones,
      cuentaBancaria: dto.cuentaBancaria,
    });

    return await this.gastoRepository.save(gasto);
  }
}









