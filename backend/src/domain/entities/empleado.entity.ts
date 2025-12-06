export enum PuestoEmpleado {
  CAJERO = 'CAJERO',
  DEPOSITO = 'DEPOSITO',
  VENDEDOR = 'VENDEDOR',
}

export interface PagoEmpleado {
  id?: string;
  mes: string; // Formato: YYYY-MM
  monto: number;
  fechaPago: Date;
  observaciones?: string;
  createdAt?: Date;
}

export interface AdelantoEmpleado {
  id?: string;
  fecha: Date;
  monto: number;
  observaciones?: string;
  mesAplicado: string; // Formato: YYYY-MM
  createdAt?: Date;
}

export interface AsistenciaEmpleado {
  id?: string;
  fecha: Date;
  presente: boolean;
  observaciones?: string;
  createdAt?: Date;
}

export interface DocumentoEmpleado {
  id?: string;
  tipo: 'DNI' | 'CONTRATO';
  nombre: string;
  url: string; // URL o path del archivo
  fechaSubida: Date;
  createdAt?: Date;
}

export class Empleado {
  public id?: string;
  public nombre: string;
  public dni: string;
  public telefono?: string;
  public direccion?: string;
  public puesto: PuestoEmpleado;
  public fechaIngreso: Date;
  public sueldoMensual: number;
  public pagos: PagoEmpleado[];
  public adelantos: AdelantoEmpleado[];
  public asistencias: AsistenciaEmpleado[];
  public documentos: DocumentoEmpleado[];
  public activo: boolean;
  public createdAt?: Date;
  public updatedAt?: Date;

  private constructor(props: {
    id?: string;
    nombre: string;
    dni: string;
    telefono?: string;
    direccion?: string;
    puesto: PuestoEmpleado;
    fechaIngreso: Date;
    sueldoMensual: number;
    pagos?: PagoEmpleado[];
    adelantos?: AdelantoEmpleado[];
    asistencias?: AsistenciaEmpleado[];
    documentos?: DocumentoEmpleado[];
    activo?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.dni = props.dni;
    this.telefono = props.telefono;
    this.direccion = props.direccion;
    this.puesto = props.puesto;
    this.fechaIngreso = props.fechaIngreso;
    this.sueldoMensual = props.sueldoMensual;
    this.pagos = props.pagos || [];
    this.adelantos = props.adelantos || [];
    this.asistencias = props.asistencias || [];
    this.documentos = props.documentos || [];
    this.activo = props.activo !== undefined ? props.activo : true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static crear(props: {
    nombre: string;
    dni: string;
    telefono?: string;
    direccion?: string;
    puesto: PuestoEmpleado;
    fechaIngreso: Date;
    sueldoMensual: number;
  }): Empleado {
    return new Empleado({
      ...props,
      pagos: [],
      adelantos: [],
      asistencias: [],
      documentos: [],
      activo: true,
    });
  }

  public static reconstruir(props: {
    id: string;
    nombre: string;
    dni: string;
    telefono?: string;
    direccion?: string;
    puesto: PuestoEmpleado;
    fechaIngreso: Date;
    sueldoMensual: number;
    pagos?: PagoEmpleado[];
    adelantos?: AdelantoEmpleado[];
    asistencias?: AsistenciaEmpleado[];
    documentos?: DocumentoEmpleado[];
    activo?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Empleado {
    return new Empleado(props);
  }

  public agregarPago(pago: PagoEmpleado): void {
    this.pagos.push(pago);
    this.updatedAt = new Date();
  }

  public agregarAdelanto(adelanto: AdelantoEmpleado): void {
    this.adelantos.push(adelanto);
    this.updatedAt = new Date();
  }

  public registrarAsistencia(asistencia: AsistenciaEmpleado): void {
    this.asistencias.push(asistencia);
    this.updatedAt = new Date();
  }

  public agregarDocumento(documento: DocumentoEmpleado): void {
    this.documentos.push(documento);
    this.updatedAt = new Date();
  }

  public obtenerEstadoPagoMes(mes: string): 'PAGADO' | 'PENDIENTE' {
    const pagoDelMes = this.pagos.find((p) => p.mes === mes);
    return pagoDelMes ? 'PAGADO' : 'PENDIENTE';
  }

  public obtenerTotalAdelantosMes(mes: string): number {
    return this.adelantos
      .filter((a) => a.mesAplicado === mes)
      .reduce((sum, a) => sum + a.monto, 0);
  }

  public obtenerSaldoPendienteMes(mes: string): number {
    const totalAdelantos = this.obtenerTotalAdelantosMes(mes);
    const pagoDelMes = this.pagos.find((p) => p.mes === mes);
    const montoPagado = pagoDelMes ? pagoDelMes.monto : 0;
    return this.sueldoMensual - montoPagado - totalAdelantos;
  }

  public obtenerDiasTrabajadosMes(mes: string): number {
    const [year, month] = mes.split('-').map(Number);
    return this.asistencias.filter((a) => {
      const fechaAsistencia = new Date(a.fecha);
      return (
        fechaAsistencia.getFullYear() === year &&
        fechaAsistencia.getMonth() + 1 === month &&
        a.presente
      );
    }).length;
  }

  public obtenerFaltasMes(mes: string): number {
    const [year, month] = mes.split('-').map(Number);
    return this.asistencias.filter((a) => {
      const fechaAsistencia = new Date(a.fecha);
      return (
        fechaAsistencia.getFullYear() === year &&
        fechaAsistencia.getMonth() + 1 === month &&
        !a.presente
      );
    }).length;
  }

  public actualizarDatos(datos: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    puesto?: PuestoEmpleado;
    sueldoMensual?: number;
  }): void {
    if (datos.nombre) this.nombre = datos.nombre;
    if (datos.telefono !== undefined) this.telefono = datos.telefono;
    if (datos.direccion !== undefined) this.direccion = datos.direccion;
    if (datos.puesto) this.puesto = datos.puesto;
    if (datos.sueldoMensual !== undefined) this.sueldoMensual = datos.sueldoMensual;
    this.updatedAt = new Date();
  }

  public desactivar(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  public activar(): void {
    this.activo = true;
    this.updatedAt = new Date();
  }
}









