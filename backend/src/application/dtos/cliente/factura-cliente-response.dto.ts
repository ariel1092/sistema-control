import { differenceInDays } from 'date-fns';

export class FacturaClienteResponseDto {
  id: string;
  numero: string;
  clienteId: string;
  fecha: Date;
  fechaVencimiento: Date;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  pagada: boolean;
  diasHastaVencimiento: number;
  estaVencida: boolean;
  estaPorVencer: boolean;
  descripcion?: string;
  observaciones?: string;
  ventaId?: string;
  createdAt: Date;
  updatedAt: Date;
}


