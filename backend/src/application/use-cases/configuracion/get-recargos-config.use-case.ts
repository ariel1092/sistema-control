import { Inject, Injectable } from '@nestjs/common';
import { IConfiguracionRecargosRepository } from '../../ports/configuracion-recargos.repository.interface';
import { RecargosConfigResponseDto } from '../../dtos/configuracion/recargos.dto';

@Injectable()
export class GetRecargosConfigUseCase {
  constructor(
    @Inject('IConfiguracionRecargosRepository')
    private readonly repo: IConfiguracionRecargosRepository,
  ) {}

  async execute(): Promise<RecargosConfigResponseDto> {
    const cfg = await this.repo.get();
    return {
      recargoDebitoPct: cfg.recargoDebitoPct,
      recargoCreditoPct: cfg.recargoCreditoPct,
    };
  }
}



