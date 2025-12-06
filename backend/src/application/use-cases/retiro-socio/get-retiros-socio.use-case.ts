import { Injectable, Inject } from '@nestjs/common';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { CuentaBancaria } from '../../../domain/enums/cuenta-bancaria.enum';
import { RetiroSocio } from '../../../domain/entities/retiro-socio.entity';

@Injectable()
export class GetRetirosSocioUseCase {
  constructor(
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
  ) {}

  async execute(cuentaBancaria?: CuentaBancaria, fechaInicio?: Date, fechaFin?: Date): Promise<RetiroSocio[]> {
    return await this.retiroRepository.findAll(cuentaBancaria, fechaInicio, fechaFin);
  }
}









