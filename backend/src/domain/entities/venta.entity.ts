import { DetalleVenta } from './detalle-venta.entity';
import { MetodoPago } from '../value-objects/metodo-pago.vo';
import { EstadoVenta } from '../enums/estado-venta.enum';
import { TipoComprobante } from '../enums/tipo-comprobante.enum';
import { VentaDomainException } from '../exceptions/venta.exception';

export class Venta {
  constructor(
    public readonly id: string | undefined,
    public readonly numero: string,
    public readonly vendedorId: string,
    public readonly fecha: Date,
    public readonly detalles: DetalleVenta[],
    public readonly metodosPago: MetodoPago[],
    public clienteNombre?: string,
    public clienteDNI?: string,
    public descuentoGeneral: number = 0,
    public observaciones?: string,
    public estado: EstadoVenta = EstadoVenta.COMPLETADA,
    public tipoComprobante: TipoComprobante = TipoComprobante.FACTURA,
    public esCuentaCorriente: boolean = false,
    public recargoCredito: number = 0,
    public canceladoPor?: string,
    public canceladoEn?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  // REGLAS DE NEGOCIO
  private validate(): void {
    // Permitir ventas sin detalles (solo registro de pago)
    // if (this.detalles.length === 0) {
    //   throw new VentaDomainException(
    //     'Una venta debe tener al menos un detalle',
    //   );
    // }

    if (this.descuentoGeneral < 0 || this.descuentoGeneral > 100) {
      throw new VentaDomainException(
        'Descuento debe estar entre 0 y 100%',
      );
    }

    if (this.metodosPago.length === 0) {
      throw new VentaDomainException(
        'Debe especificar al menos un método de pago',
      );
    }

    if (!this.vendedorId) {
      throw new VentaDomainException('El vendedor es obligatorio');
    }

    if (!this.numero || this.numero.trim() === '') {
      throw new VentaDomainException('El número de venta es obligatorio');
    }

    // Validar que el total de pagos coincida con el total de venta
    // Si no hay detalles, el total es la suma de los métodos de pago
    const totalPagos = this.metodosPago.reduce((sum, mp) => sum + mp.monto, 0);
    const totalVenta = this.detalles.length > 0 ? this.calcularTotal() : totalPagos;

    if (Math.abs(totalPagos - totalVenta) > 0.01) {
      throw new VentaDomainException(
        `Total de pagos ($${totalPagos.toFixed(2)}) no coincide con total de venta ($${totalVenta.toFixed(2)})`,
      );
    }
  }

  // CÁLCULOS DE NEGOCIO
  public calcularSubtotal(): number {
    if (this.detalles.length === 0) {
      // Si no hay detalles, el subtotal es la suma de métodos de pago (sin recargos)
      return this.metodosPago.reduce((sum, mp) => {
        // Si tiene recargo, calcular el monto base
        if (mp.recargo && mp.recargo > 0) {
          return sum + (mp.monto / (1 + mp.recargo / 100));
        }
        return sum + mp.monto;
      }, 0);
    }
    return this.detalles.reduce(
      (sum, detalle) => sum + detalle.calcularSubtotal(),
      0,
    );
  }

  public calcularDescuento(): number {
    const subtotal = this.calcularSubtotal();
    return subtotal * (this.descuentoGeneral / 100);
  }

  public calcularRecargo(): number {
    /**
     * Recargos por tarjeta (débito/crédito).
     *
     * Regla (nuevo estándar):
     * - `mp.monto` se interpreta como MONTO FINAL cobrado por ese medio (incluye recargo si aplica).
     * - `mp.recargo` es el % aplicado a ese medio.
     * - El recargo total se calcula desde los propios métodos de pago (no desde `venta.recargoCredito`).
     *
     * Nota: para ventas sin detalles, el total se valida contra suma de pagos y no contra `calcularTotal()`.
     */
    if (this.detalles.length === 0) return 0;

    let recargoTotal = 0;

    for (const mp of this.metodosPago) {
      const tipo = String(mp.tipo);
      const pct = mp.recargo || 0;
      if ((tipo === 'DEBITO' || tipo === 'CREDITO') && pct > 0) {
        const divisor = 1 + pct / 100;
        const base = mp.monto / divisor;
        recargoTotal += (mp.monto - base);
      }
    }

    return recargoTotal;
  }

  public calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    const descuento = this.calcularDescuento();
    const recargo = this.calcularRecargo();

    return subtotal - descuento + recargo;
  }

  public cancelar(usuarioId: string, motivo?: string): void {
    if (this.estado === EstadoVenta.CANCELADA) {
      throw new VentaDomainException('La venta ya está cancelada');
    }

    this.estado = EstadoVenta.CANCELADA;
    this.canceladoPor = usuarioId;
    this.canceladoEn = new Date(); // Fecha actual

    if (motivo) {
      this.observaciones = motivo;
    }
  }

  public agregarDetalle(detalle: DetalleVenta): void {
    if (
      this.estado !== EstadoVenta.BORRADOR &&
      this.estado !== EstadoVenta.COMPLETADA
    ) {
      throw new VentaDomainException(
        'No se pueden agregar detalles a esta venta',
      );
    }

    const detalleConVenta = detalle.asignarVenta(this.id || '');
    this.detalles.push(detalleConVenta);
  }

  // MÉTODO FACTORY
  static crear(params: {
    vendedorId: string;
    detalles: DetalleVenta[];
    metodosPago: MetodoPago[];
    clienteNombre?: string;
    clienteDNI?: string;
    descuentoGeneral?: number;
    observaciones?: string;
    estado?: EstadoVenta;
    tipoComprobante?: TipoComprobante;
    esCuentaCorriente?: boolean;
    recargoCredito?: number;
    numero?: string; // Permitir pasar un número personalizado
    fecha?: Date; // Permitir pasar una fecha específica (útil para tests)
  }): Venta {
    const numero = params.numero || this.generarNumeroVenta(params.tipoComprobante);

    // Normalizar la fecha al inicio del día en UTC basado en la fecha LOCAL del usuario
    // Esto asegura que todas las ventas del mismo día local tengan la misma fecha base en UTC
    let fechaVenta: Date;
    if (params.fecha) {
      // Si se pasa una fecha, usar la fecha local (no UTC) para determinar el día
      const año = params.fecha.getFullYear();
      const mes = params.fecha.getMonth();
      const dia = params.fecha.getDate();
      // Crear fecha en UTC pero con el día/mes/año de la fecha local
      fechaVenta = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
    } else {
      // Usar la fecha actual LOCAL para determinar el día, pero guardar en UTC
      const ahora = new Date();
      const año = ahora.getFullYear(); // Usar getFullYear() local, no UTC
      const mes = ahora.getMonth(); // Usar getMonth() local, no UTC
      const dia = ahora.getDate(); // Usar getDate() local, no UTC
      // Crear fecha en UTC pero con el día/mes/año de la fecha local actual
      fechaVenta = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));

      // DEBUG: Log para verificar la fecha que se está guardando
      console.log(`[Venta.crear] Fecha actual del servidor (local): ${ahora.toISOString()}`);
      console.log(`[Venta.crear] Fecha que se guardará (UTC normalizada): ${fechaVenta.toISOString()}`);
      console.log(`[Venta.crear] Año: ${año}, Mes: ${mes}, Día: ${dia}`);
    }

    return new Venta(
      undefined, // será asignado por el repositorio
      numero,
      params.vendedorId,
      fechaVenta,
      params.detalles,
      params.metodosPago,
      params.clienteNombre,
      params.clienteDNI,
      params.descuentoGeneral || 0,
      params.observaciones,
      params.estado || EstadoVenta.COMPLETADA,
      params.tipoComprobante || TipoComprobante.REMITO, // Remito por defecto (más usado)
      params.esCuentaCorriente || false,
      params.recargoCredito || 0,
    );
  }

  private static generarNumeroVenta(tipoComprobante?: TipoComprobante): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    // Usar timestamp en milisegundos para garantizar unicidad
    // Tomar los últimos 6 dígitos del timestamp para mantener formato corto
    const timestamp = Date.now();
    const secuencial = timestamp.toString().slice(-6);

    // Prefijo según tipo de comprobante
    let prefijo = 'VTA';
    switch (tipoComprobante) {
      case TipoComprobante.PRESUPUESTO:
        prefijo = 'PRES';
        break;
      case TipoComprobante.REMITO:
        prefijo = 'REM';
        break;
      case TipoComprobante.FACTURA:
        prefijo = 'FAC';
        break;
      default:
        prefijo = 'VTA';
    }

    return `${prefijo}-${año}${mes}${dia}-${secuencial}`;
  }

}

