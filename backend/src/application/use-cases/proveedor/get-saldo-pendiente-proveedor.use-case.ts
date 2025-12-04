import { Inject, Injectable } from '@nestjs/common';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { differenceInDays } from 'date-fns';

export interface SaldoPendienteDto {
  cantidadPendientes: number;
  saldoTotal: number;
  saldoProximoVencer: number;
}

@Injectable()
export class GetSaldoPendienteProveedorUseCase {
  constructor(
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
  ) {}

  async execute(proveedorId: string): Promise<SaldoPendienteDto> {
    const facturas = await this.facturaRepository.findByProveedor(proveedorId);
    
    const facturasPendientes = facturas.filter(f => !f.pagada && f.calcularSaldoPendiente() > 0);
    
    const cantidadPendientes = facturasPendientes.length;
    
    const saldoTotal = facturasPendientes.reduce((sum, f) => {
      return sum + f.calcularSaldoPendiente();
    }, 0);

    // Encontrar el saldo más próximo a vencer (la factura con fecha de vencimiento más cercana)
    let saldoProximoVencer = 0;
    if (facturasPendientes.length > 0) {
      const hoy = new Date();
      const facturasConVencimiento = facturasPendientes
        .map(f => ({
          factura: f,
          diasHastaVencimiento: differenceInDays(f.fechaVencimiento, hoy),
        }))
        .filter(f => f.diasHastaVencimiento >= 0)
        .sort((a, b) => a.diasHastaVencimiento - b.diasHastaVencimiento);
      
      if (facturasConVencimiento.length > 0) {
        saldoProximoVencer = facturasConVencimiento[0].factura.calcularSaldoPendiente();
      } else {
        // Si todas están vencidas, tomar la más recientemente vencida
        const facturasVencidas = facturasPendientes
          .map(f => ({
            factura: f,
            diasVencida: Math.abs(differenceInDays(f.fechaVencimiento, hoy)),
          }))
          .sort((a, b) => a.diasVencida - b.diasVencida);
        
        if (facturasVencidas.length > 0) {
          saldoProximoVencer = facturasVencidas[0].factura.calcularSaldoPendiente();
        }
      }
    }

    return {
      cantidadPendientes,
      saldoTotal,
      saldoProximoVencer,
    };
  }
}

