import { Injectable, Inject } from '@nestjs/common';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { CreateRetiroSocioDto } from '../../dtos/retiro-socio/create-retiro-socio.dto';
import { RetiroSocio } from '../../../domain/entities/retiro-socio.entity';

@Injectable()
export class CreateRetiroSocioUseCase {
  constructor(
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
  ) {}

  async execute(dto: CreateRetiroSocioDto): Promise<RetiroSocio> {
    const retiro = RetiroSocio.crear({
      fecha: new Date(dto.fecha),
      cuentaBancaria: dto.cuentaBancaria,
      monto: dto.monto,
      descripcion: dto.descripcion,
      observaciones: dto.observaciones,
    });

    return await this.retiroRepository.save(retiro);
  }
}


