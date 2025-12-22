import { Injectable, Inject } from '@nestjs/common';
import { IRetiroSocioRepository } from '../../ports/retiro-socio.repository.interface';
import { CreateRetiroSocioDto } from '../../dtos/retiro-socio/create-retiro-socio.dto';
import { RetiroSocio } from '../../../domain/entities/retiro-socio.entity';
import { parseLocalDateOnly } from '../../../utils/date.utils';

@Injectable()
export class CreateRetiroSocioUseCase {
  constructor(
    @Inject('IRetiroSocioRepository')
    private readonly retiroRepository: IRetiroSocioRepository,
  ) {}

  async execute(dto: CreateRetiroSocioDto): Promise<RetiroSocio> {
    // Combinar fecha y hora si se proporciona
    const baseDate = parseLocalDateOnly(dto.fecha);

    let fechaRetiro: Date;
    if (dto.hora) {
      const [horas, minutos] = dto.hora.split(':');
      baseDate.setHours(parseInt(horas, 10), parseInt(minutos, 10), 0, 0);
      fechaRetiro = baseDate;
    } else {
      fechaRetiro = baseDate;
    }

    const retiro = RetiroSocio.crear({
      fecha: fechaRetiro,
      cuentaBancaria: dto.cuentaBancaria,
      monto: dto.monto,
      descripcion: dto.descripcion,
      observaciones: dto.observaciones,
    });

    return await this.retiroRepository.save(retiro);
  }
}








