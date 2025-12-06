import { Inject, Injectable } from '@nestjs/common';
import { IFacturaClienteRepository } from '../../ports/factura-cliente.repository.interface';
import { FacturaClienteResponseDto } from '../../dtos/cliente/factura-cliente-response.dto';
import { differenceInDays } from 'date-fns';

@Injectable()
export class GetFacturasClienteUseCase {
  constructor(
    @Inject('IFacturaClienteRepository')
    private readonly facturaRepository: IFacturaClienteRepository,
  ) {}

  async execute(clienteId: string): Promise<FacturaClienteResponseDto[]> {
    const facturas = await this.facturaRepository.findByCliente(clienteId);
    const hoy = new Date();

    return facturas.map((factura) => {
      const diasHastaVencimiento = differenceInDays(factura.fechaVencimiento, hoy);
      const saldoPendiente = factura.calcularSaldoPendiente();

      return {
        id: factura.id!,
        numero: factura.numero,
        clienteId: factura.clienteId,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        montoTotal: factura.montoTotal,
        montoPagado: factura.montoPagado,
        saldoPendiente,
        pagada: factura.pagada,
        diasHastaVencimiento,
        estaVencida: factura.estaVencida(),
        estaPorVencer: factura.estaPorVencer(5),
        descripcion: factura.descripcion,
        observaciones: factura.observaciones,
        ventaId: factura.ventaId,
        createdAt: factura.createdAt,
        updatedAt: factura.updatedAt,
      };
    });
  }
}


