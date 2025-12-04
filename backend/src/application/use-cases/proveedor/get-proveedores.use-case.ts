import { Inject, Injectable } from '@nestjs/common';
import { IProveedorRepository } from '../../ports/proveedor.repository.interface';
import { Proveedor } from '../../../domain/entities/proveedor.entity';
import { GetSaldoPendienteProveedorUseCase } from './get-saldo-pendiente-proveedor.use-case';

@Injectable()
export class GetProveedoresUseCase {
  constructor(
    @Inject('IProveedorRepository')
    private readonly proveedorRepository: IProveedorRepository,
    private readonly getSaldoPendienteUseCase: GetSaldoPendienteProveedorUseCase,
  ) {}

  async execute(): Promise<any[]> {
    const proveedores = await this.proveedorRepository.findAll();
    
    // Calcular resumen financiero para cada proveedor
    const proveedoresConResumen = await Promise.all(
      proveedores.map(async (proveedor) => {
        const saldoPendiente = await this.getSaldoPendienteUseCase.execute(proveedor.id!);
        return {
          ...proveedor,
          resumenFacturas: saldoPendiente,
          saldoPendiente: saldoPendiente,
        };
      })
    );

    return proveedoresConResumen;
  }
}
