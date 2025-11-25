export class CierreCaja {
  constructor(
    public readonly id: string | undefined,
    public readonly fecha: Date,
    public readonly usuarioId: string,
    public totalEfectivo: number,
    public totalTarjeta: number,
    public totalTransferencia: number,
    public totalGeneral: number,
    public cantidadVentas: number,
    public estado: 'ABIERTO' | 'CERRADO' = 'ABIERTO',
    public observaciones?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.usuarioId) {
      throw new Error('El usuario es obligatorio');
    }

    if (this.totalEfectivo < 0 || this.totalTarjeta < 0 || this.totalTransferencia < 0) {
      throw new Error('Los totales no pueden ser negativos');
    }

    if (this.cantidadVentas < 0) {
      throw new Error('La cantidad de ventas no puede ser negativa');
    }

    const totalCalculado = this.totalEfectivo + this.totalTarjeta + this.totalTransferencia;
    if (Math.abs(this.totalGeneral - totalCalculado) > 0.01) {
      throw new Error(
        `El total general (${this.totalGeneral}) no coincide con la suma de métodos de pago (${totalCalculado})`,
      );
    }
  }

  public actualizarTotales(params: {
    totalEfectivo?: number;
    totalTarjeta?: number;
    totalTransferencia?: number;
    cantidadVentas?: number;
  }): void {
    if (params.totalEfectivo !== undefined) {
      this.totalEfectivo = params.totalEfectivo;
    }

    if (params.totalTarjeta !== undefined) {
      this.totalTarjeta = params.totalTarjeta;
    }

    if (params.totalTransferencia !== undefined) {
      this.totalTransferencia = params.totalTransferencia;
    }

    if (params.cantidadVentas !== undefined) {
      this.cantidadVentas = params.cantidadVentas;
    }

    this.totalGeneral = this.totalEfectivo + this.totalTarjeta + this.totalTransferencia;
    this.validate();
  }

  public cerrar(observaciones?: string): void {
    if (this.estado === 'CERRADO') {
      throw new Error('La caja ya está cerrada');
    }

    this.estado = 'CERRADO';
    if (observaciones) {
      this.observaciones = observaciones;
    }
  }

  public estaCerrada(): boolean {
    return this.estado === 'CERRADO';
  }

  static crear(params: {
    fecha: Date;
    usuarioId: string;
    totalEfectivo?: number;
    totalTarjeta?: number;
    totalTransferencia?: number;
    cantidadVentas?: number;
    estado?: 'ABIERTO' | 'CERRADO';
    observaciones?: string;
  }): CierreCaja {
    const totalEfectivo = params.totalEfectivo || 0;
    const totalTarjeta = params.totalTarjeta || 0;
    const totalTransferencia = params.totalTransferencia || 0;
    const totalGeneral = totalEfectivo + totalTarjeta + totalTransferencia;

    return new CierreCaja(
      undefined,
      params.fecha,
      params.usuarioId,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalGeneral,
      params.cantidadVentas || 0,
      params.estado || 'ABIERTO',
      params.observaciones,
    );
  }
}





