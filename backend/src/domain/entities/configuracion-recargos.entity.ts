export class ConfiguracionRecargos {
  constructor(
    public readonly recargoDebitoPct: number,
    public readonly recargoCreditoPct: number,
    public readonly updatedBy?: string,
    public readonly updatedAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.recargoDebitoPct < 0 || this.recargoDebitoPct > 100) {
      throw new Error('El recargo de débito debe estar entre 0 y 100');
    }
    if (this.recargoCreditoPct < 0 || this.recargoCreditoPct > 100) {
      throw new Error('El recargo de crédito debe estar entre 0 y 100');
    }
  }

  static porDefecto(): ConfiguracionRecargos {
    return new ConfiguracionRecargos(0, 0);
  }
}



