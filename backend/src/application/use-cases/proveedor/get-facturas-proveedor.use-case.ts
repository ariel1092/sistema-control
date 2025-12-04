import { Inject, Injectable } from '@nestjs/common';
import { IFacturaProveedorRepository } from '../../ports/factura-proveedor.repository.interface';
import { differenceInDays } from 'date-fns';

export interface FacturaProveedorResponseDto {
  id: string;
  numero: string;
  fecha: Date;
  fechaVencimiento: Date;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  pagada: boolean;
  diasHastaVencimiento: number;
  estaVencida: boolean;
  estaPorVencer: boolean;
  observaciones?: string;
}

@Injectable()
export class GetFacturasProveedorUseCase {
  constructor(
    @Inject('IFacturaProveedorRepository')
    private readonly facturaRepository: IFacturaProveedorRepository,
  ) {}

  async execute(proveedorId: string): Promise<FacturaProveedorResponseDto[]> {
    console.log(`[GetFacturasProveedorUseCase] Obteniendo facturas para proveedor: ${proveedorId}`);
    const facturas = await this.facturaRepository.findByProveedor(proveedorId);
    console.log(`[GetFacturasProveedorUseCase] Facturas encontradas: ${facturas.length}`);
    
    const hoy = new Date();
    
    const facturasResponse = facturas.map((factura) => {
      const diasHastaVencimiento = differenceInDays(factura.fechaVencimiento, hoy);
      const saldoPendiente = factura.calcularSaldoPendiente();
      
      return {
        id: factura.id!,
        numero: factura.numero,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        total: factura.calcularTotal(),
        montoPagado: factura.montoPagado,
        saldoPendiente,
        pagada: factura.pagada,
        diasHastaVencimiento,
        estaVencida: factura.estaVencida(),
        estaPorVencer: factura.estaPorVencer(5),
        observaciones: factura.observaciones,
      };
    });
    
    console.log(`[GetFacturasProveedorUseCase] Facturas procesadas: ${facturasResponse.length}`);
    return facturasResponse;
  }
}

