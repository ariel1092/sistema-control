import { TipoEventoVenta } from '../enums/tipo-evento-venta.enum';

export class MovimientoVenta {
  constructor(
    public readonly id: string | undefined,
    public readonly ventaId: string,
    public readonly tipoEvento: TipoEventoVenta,
    public readonly fecha: Date,
    public readonly usuarioId?: string,
    public readonly observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.ventaId) {
      throw new Error('El ID de la venta es obligatorio');
    }

    if (!Object.values(TipoEventoVenta).includes(this.tipoEvento)) {
      throw new Error('El tipo de evento de venta no es válido');
    }
  }

  static crear(params: {
    ventaId: string;
    tipoEvento: TipoEventoVenta;
    fecha?: Date;
    usuarioId?: string;
    observaciones?: string;
  }): MovimientoVenta {
    return new MovimientoVenta(
      undefined,
      params.ventaId,
      params.tipoEvento,
      params.fecha || new Date(),
      params.usuarioId,
      params.observaciones,
    );
  }
}


