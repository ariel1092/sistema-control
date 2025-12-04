import { Injectable, Inject } from '@nestjs/common';
import { IGastoDiarioRepository } from '../../ports/gasto-diario.repository.interface';
import { GastoDiario } from '../../../domain/entities/gasto-diario.entity';

@Injectable()
export class GetGastosDiariosUseCase {
  constructor(
    @Inject('IGastoDiarioRepository')
    private readonly gastoRepository: IGastoDiarioRepository,
  ) {}

  async execute(fechaInicio?: Date, fechaFin?: Date, categoria?: string): Promise<GastoDiario[]> {
    return await this.gastoRepository.findAll(fechaInicio, fechaFin, categoria);
  }
}








