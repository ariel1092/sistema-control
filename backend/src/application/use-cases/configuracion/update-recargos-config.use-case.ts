import { Inject, Injectable } from '@nestjs/common';
import { IConfiguracionRecargosRepository } from '../../ports/configuracion-recargos.repository.interface';
import { RecargosConfigResponseDto, UpdateRecargosConfigDto } from '../../dtos/configuracion/recargos.dto';

@Injectable()
export class UpdateRecargosConfigUseCase {
  constructor(
    @Inject('IConfiguracionRecargosRepository')
    private readonly repo: IConfiguracionRecargosRepository,
  ) {}

  async execute(dto: UpdateRecargosConfigDto, usuarioId?: string): Promise<RecargosConfigResponseDto> {
    const updated = await this.repo.update({
      recargoDebitoPct: dto.recargoDebitoPct,
      recargoCreditoPct: dto.recargoCreditoPct,
      updatedBy: usuarioId,
    });
    return {
      recargoDebitoPct: updated.recargoDebitoPct,
      recargoCreditoPct: updated.recargoCreditoPct,
    };
  }
}




