import { Inject, Injectable } from '@nestjs/common';
import { IMovimientoCuentaCorrienteClienteRepository } from '../../ports/movimiento-cuenta-corriente-cliente.repository.interface';
import { IClienteRepository } from '../../ports/cliente.repository.interface';
import { MovimientoCuentaCorrienteCliente } from '../../../domain/entities/movimiento-cuenta-corriente-cliente.entity';
import { TipoMovimientoCC } from '../../../domain/enums/tipo-movimiento-cc.enum';
import { TipoMetodoPago } from '../../../domain/enums/tipo-metodo-pago.enum';
import { Venta } from '../../../domain/entities/venta.entity';

@Injectable()
export class RegistrarMovimientoCCVentaUseCase {
  constructor(
    @Inject('IMovimientoCuentaCorrienteClienteRepository')
    private readonly movimientoCCRepository: IMovimientoCuentaCorrienteClienteRepository,
    @Inject('IClienteRepository')
    private readonly clienteRepository: IClienteRepository,
  ) { }

  async ejecutarCargoPorVenta(params: {
    venta: Venta;
    clienteDNI: string;
    usuarioId?: string;
  }, options?: { session?: any }): Promise<void> {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! ENTRANDO A REGISTRAR MOVIMIENTO CC                     !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    const { venta, clienteDNI, usuarioId } = params;
    const session = options?.session;

    console.log(`[SISTEMA-CC] Iniciando proceso de cargo. Venta: ${venta.numero}, DNI: ${clienteDNI}`);

    const cliente = await this.clienteRepository.findByDNI(clienteDNI.trim());
    if (!cliente) {
      console.error(`[SISTEMA-CC] ERROR: Cliente con DNI "${clienteDNI}" no encontrado en la base de datos.`);
      throw new Error(`Cliente con DNI ${clienteDNI} no encontrado para registrar cuenta corriente`);
    }
    
    console.log(`[SISTEMA-CC] Cliente encontrado: ${cliente.nombre} (${cliente.id}). Habilitado CC: ${cliente.tieneCuentaCorriente}`);

    if (!cliente.tieneCuentaCorriente) {
      console.warn(`[SISTEMA-CC] ADVERTENCIA: El cliente ${cliente.nombre} no tiene habilitada la cuenta corriente. Abortando registro.`);
      throw new Error(`El cliente con DNI ${clienteDNI} no tiene cuenta corriente habilitada`);
    }

    const saldoAnterior = await this.movimientoCCRepository.getUltimoSaldo(cliente.id!);
    console.log(`[SISTEMA-CC] Saldo anterior obtenido: ${saldoAnterior}`);

    // Buscar el monto específico pagado con Cuenta Corriente
    const pagoCC = venta.metodosPago.find(mp => 
      mp.tipo === TipoMetodoPago.CUENTA_CORRIENTE || String(mp.tipo) === 'CUENTA_CORRIENTE'
    );
    const montoDeuda = pagoCC ? pagoCC.monto : venta.calcularTotal();
    
    // Detallar los productos en la descripción
    let detalleProductos = 'Sin detalle de productos';
    if (venta.detalles && venta.detalles.length > 0) {
      detalleProductos = venta.detalles.map(d => `${d.cantidad}x ${d.nombreProducto}`).join(', ');
    }
    const descripcionFinal = `Venta ${venta.numero}: ${detalleProductos}`.substring(0, 200); // Limitar largo

    const movimiento = MovimientoCuentaCorrienteCliente.crear({
      clienteId: cliente.id!,
      tipo: TipoMovimientoCC.CARGO,
      fecha: venta.fecha,
      monto: montoDeuda,
      descripcion: descripcionFinal,
      documentoId: venta.id,
      documentoNumero: venta.numero,
      saldoAnterior,
      usuarioId,
    });

    console.log(`[SISTEMA-CC] Guardando movimiento en el repositorio...`);
    await this.movimientoCCRepository.save(movimiento, { session });
    
    console.log(`[SISTEMA-CC] Actualizando deuda en el perfil del cliente...`);
    cliente.agregarDeuda(montoDeuda);
    await this.clienteRepository.save(cliente, { session });
    
    console.log(`[SISTEMA-CC] Registro de Cuenta Corriente FINALIZADO con éxito.`);
  }

  async revertirPorVenta(params: {
    venta: Venta;
    usuarioId?: string;
  }, options?: { session?: any }): Promise<void> {
    const { venta, usuarioId } = params;
    const session = options?.session;
    if (!venta.id) return;

    // Buscar movimientos originales vinculados a esta venta
    const movimientos = await this.movimientoCCRepository.findByDocumentoId(venta.id);
    const movimientoOriginal = movimientos.find(m => m.tipo === TipoMovimientoCC.CARGO || m.tipo === TipoMovimientoCC.VENTA); // VENTA support for legacy

    if (!movimientoOriginal || !movimientoOriginal.clienteId) return;

    const cliente = await this.clienteRepository.findById(movimientoOriginal.clienteId);
    if (!cliente) return;

    const saldoAnterior = await this.movimientoCCRepository.getUltimoSaldo(cliente.id!);

    // Crear UN SOLO movimiento de REVERSO
    // Monto negativo para reflejar la anulación del cargo
    const montoReverso = -Math.abs(movimientoOriginal.monto);

    const reverso = MovimientoCuentaCorrienteCliente.crear({
      clienteId: cliente.id!,
      tipo: TipoMovimientoCC.REVERSO,
      fecha: new Date(),
      monto: montoReverso,
      descripcion: `Reversión Cargo Venta ${venta.numero}`,
      documentoId: venta.id,
      documentoNumero: venta.numero,
      saldoAnterior,
      observaciones: 'Anulación automática por cancelación de venta',
      usuarioId,
    });

    await this.movimientoCCRepository.save(reverso, { session });
    // REVERSO negativo = Reducir deuda (agregar un negativo es restar)
    cliente.agregarDeuda(montoReverso);
    await this.clienteRepository.save(cliente, { session });
  }
}



