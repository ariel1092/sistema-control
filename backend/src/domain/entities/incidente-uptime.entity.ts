export enum EstadoIncidente {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
}

export class IncidenteUptime {
  constructor(
    public readonly id: string | undefined,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date | null,
    public readonly reason: string,
    public readonly duration: string | null,
    public readonly durationSeconds: number | null,
    public readonly monitorUrl: string,
    public readonly monitorName: string,
    public readonly estado: EstadoIncidente = EstadoIncidente.ABIERTO,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.startDateTime) {
      throw new Error('La fecha de inicio es obligatoria');
    }

    if (!this.reason || this.reason.trim().length === 0) {
      throw new Error('La razón del incidente es obligatoria');
    }

    if (!this.monitorUrl || this.monitorUrl.trim().length === 0) {
      throw new Error('La URL del monitor es obligatoria');
    }

    if (!this.monitorName || this.monitorName.trim().length === 0) {
      throw new Error('El nombre del monitor es obligatorio');
    }

    if (this.endDateTime && this.endDateTime < this.startDateTime) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
    }
  }

  public cerrar(endDateTime: Date): void {
    if (this.estado === EstadoIncidente.CERRADO) {
      throw new Error('El incidente ya está cerrado');
    }

    (this as any).endDateTime = endDateTime;
    (this as any).estado = EstadoIncidente.CERRADO;

    // Calcular duración si no está definida
    if (!this.durationSeconds && endDateTime) {
      const diffMs = endDateTime.getTime() - this.startDateTime.getTime();
      (this as any).durationSeconds = Math.floor(diffMs / 1000);
      (this as any).duration = this.formatDuration((this as any).durationSeconds);
    }

    (this as any).updatedAt = new Date();
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (minutes === 0 && secs === 0) {
      return `${hours}h`;
    }
    if (secs === 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${secs}s`;
  }

  static crear(params: {
    startDateTime: Date;
    endDateTime?: Date | null;
    reason: string;
    duration?: string | null;
    durationSeconds?: number | null;
    monitorUrl: string;
    monitorName: string;
    estado?: EstadoIncidente;
  }): IncidenteUptime {
    const estado = params.endDateTime ? EstadoIncidente.CERRADO : EstadoIncidente.ABIERTO;
    return new IncidenteUptime(
      undefined,
      params.startDateTime,
      params.endDateTime || null,
      params.reason,
      params.duration || null,
      params.durationSeconds || null,
      params.monitorUrl,
      params.monitorName,
      estado,
    );
  }
}

