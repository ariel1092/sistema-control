import { ConfiguracionRecargos } from '../../domain/entities/configuracion-recargos.entity';

export interface IConfiguracionRecargosRepository {
  get(): Promise<ConfiguracionRecargos>;
  update(params: { recargoDebitoPct: number; recargoCreditoPct: number; updatedBy?: string }): Promise<ConfiguracionRecargos>;
}




