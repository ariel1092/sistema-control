import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { empleadosApi } from '../services/api';
import './EmpleadosPage.css';

interface PagoEmpleado {
  id?: string;
  mes: string;
  monto: number;
  fechaPago: Date | string;
  observaciones?: string;
  createdAt?: Date | string;
}

interface AdelantoEmpleado {
  id?: string;
  fecha: Date | string;
  monto: number;
  observaciones?: string;
  mesAplicado: string;
  createdAt?: Date | string;
}

interface AsistenciaEmpleado {
  id?: string;
  fecha: Date | string;
  presente: boolean;
  observaciones?: string;
  createdAt?: Date | string;
}

interface DocumentoEmpleado {
  id?: string;
  tipo: 'DNI' | 'CONTRATO';
  nombre: string;
  url: string;
  fechaSubida: Date | string;
  createdAt?: Date | string;
}

interface Empleado {
  id: string;
  nombre: string;
  dni: string;
  telefono?: string;
  direccion?: string;
  puesto: 'CAJERO' | 'DEPOSITO' | 'VENDEDOR';
  fechaIngreso: Date | string;
  sueldoMensual: number;
  pagos: PagoEmpleado[];
  adelantos: AdelantoEmpleado[];
  asistencias: AsistenciaEmpleado[];
  documentos: DocumentoEmpleado[];
  activo: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [mesActual, setMesActual] = useState(format(new Date(), 'yyyy-MM'));

  // Formulario crear empleado
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    direccion: '',
    puesto: 'VENDEDOR' as 'CAJERO' | 'DEPOSITO' | 'VENDEDOR',
    fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
    sueldoMensual: '' as string | number,
  });

  // Formularios para acciones
  const [formPago, setFormPago] = useState({ mes: mesActual, monto: '' as string | number, fechaPago: format(new Date(), 'yyyy-MM-dd'), observaciones: '' });
  const [formAdelanto, setFormAdelanto] = useState({ fecha: format(new Date(), 'yyyy-MM-dd'), monto: '' as string | number, mesAplicado: mesActual, observaciones: '' });
  const [formAsistencia, setFormAsistencia] = useState({ fecha: format(new Date(), 'yyyy-MM-dd'), presente: true, observaciones: '' });
  const [formDocumento, setFormDocumento] = useState({ tipo: 'DNI' as 'DNI' | 'CONTRATO', nombre: '', url: '', fechaSubida: format(new Date(), 'yyyy-MM-dd') });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // Removido el useEffect que establecía el monto automáticamente

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await empleadosApi.obtenerTodos(true);
      setEmpleados(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleadoDetalle = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await empleadosApi.obtenerPorId(id);
      setEmpleadoSeleccionado(response.data);
      setShowModalDetalle(true);
    } catch (err: any) {
      setError(err.message || 'Error al cargar empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await empleadosApi.crear(formData);
      setSuccess('Empleado creado exitosamente');
      setShowModalCrear(false);
      resetFormCrear();
      cargarEmpleados();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al crear empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await empleadosApi.registrarPago(empleadoSeleccionado.id, formPago);
      setSuccess('Pago registrado exitosamente');
      resetFormPago();
      cargarEmpleadoDetalle(empleadoSeleccionado.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarAdelanto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      const dataToSend = {
        ...formAdelanto,
        monto: typeof formAdelanto.monto === 'string' ? parseFloat(formAdelanto.monto) || 0 : formAdelanto.monto,
      };
      await empleadosApi.registrarAdelanto(empleadoSeleccionado.id, dataToSend);
      setSuccess('Adelanto registrado exitosamente');
      resetFormAdelanto();
      cargarEmpleadoDetalle(empleadoSeleccionado.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar adelanto');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarAsistencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await empleadosApi.registrarAsistencia(empleadoSeleccionado.id, formAsistencia);
      setSuccess('Asistencia registrada exitosamente');
      resetFormAsistencia();
      cargarEmpleadoDetalle(empleadoSeleccionado.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar asistencia');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await empleadosApi.agregarDocumento(empleadoSeleccionado.id, formDocumento);
      setSuccess('Documento agregado exitosamente');
      resetFormDocumento();
      cargarEmpleadoDetalle(empleadoSeleccionado.id);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al agregar documento');
    } finally {
      setLoading(false);
    }
  };

  const resetFormCrear = () => {
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      direccion: '',
      puesto: 'VENDEDOR',
      fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
      sueldoMensual: '',
    });
  };

  const resetFormPago = () => {
    setFormPago({ mes: mesActual, monto: '', fechaPago: format(new Date(), 'yyyy-MM-dd'), observaciones: '' });
  };

  const resetFormAdelanto = () => {
    setFormAdelanto({ fecha: format(new Date(), 'yyyy-MM-dd'), monto: '', mesAplicado: mesActual, observaciones: '' });
  };

  const resetFormAsistencia = () => {
    setFormAsistencia({ fecha: format(new Date(), 'yyyy-MM-dd'), presente: true, observaciones: '' });
  };

  const resetFormDocumento = () => {
    setFormDocumento({ tipo: 'DNI', nombre: '', url: '', fechaSubida: format(new Date(), 'yyyy-MM-dd') });
  };

  const obtenerEstadoPagoMes = (empleado: Empleado, mes: string): 'PAGADO' | 'PENDIENTE' => {
    const pagoDelMes = empleado.pagos.find((p) => p.mes === mes);
    return pagoDelMes ? 'PAGADO' : 'PENDIENTE';
  };

  const obtenerTotalAdelantosMes = (empleado: Empleado, mes: string): number => {
    return empleado.adelantos
      .filter((a) => a.mesAplicado === mes)
      .reduce((sum, a) => sum + a.monto, 0);
  };

  const obtenerSaldoPendienteMes = (empleado: Empleado, mes: string): number => {
    const totalAdelantos = obtenerTotalAdelantosMes(empleado, mes);
    const pagoDelMes = empleado.pagos.find((p) => p.mes === mes);
    const montoPagado = pagoDelMes ? pagoDelMes.monto : 0;
    return empleado.sueldoMensual - montoPagado - totalAdelantos;
  };

  const obtenerDiasTrabajadosMes = (empleado: Empleado, mes: string): number => {
    const [year, month] = mes.split('-').map(Number);
    return empleado.asistencias.filter((a) => {
      const fechaAsistencia = new Date(a.fecha);
      return (
        fechaAsistencia.getFullYear() === year &&
        fechaAsistencia.getMonth() + 1 === month &&
        a.presente
      );
    }).length;
  };

  const obtenerFaltasMes = (empleado: Empleado, mes: string): number => {
    const [year, month] = mes.split('-').map(Number);
    return empleado.asistencias.filter((a) => {
      const fechaAsistencia = new Date(a.fecha);
      return (
        fechaAsistencia.getFullYear() === year &&
        fechaAsistencia.getMonth() + 1 === month &&
        !a.presente
      );
    }).length;
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  return (
    <div className="empleados-page">
      <div className="empleados-header">
        <h1 className="page-title">👔 Empleados</h1>
        <button
          className="btn-primary"
          onClick={() => setShowModalCrear(true)}
        >
          ➕ Agregar Nuevo Empleado
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {loading && empleados.length === 0 ? (
        <div className="loading">Cargando empleados...</div>
      ) : (
        <div className="empleados-grid">
          {empleados.map((empleado) => (
            <div key={empleado.id} className="empleado-card">
              <div className="empleado-card-header">
                <h3>{empleado.nombre}</h3>
                <span className={`badge badge-${empleado.activo ? 'activo' : 'inactivo'}`}>
                  {empleado.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="empleado-card-body">
                <p><strong>DNI:</strong> {empleado.dni}</p>
                <p><strong>Puesto:</strong> {empleado.puesto}</p>
                <p><strong>Sueldo:</strong> {formatearMonto(empleado.sueldoMensual)}</p>
                <p><strong>Estado {format(new Date(mesActual + '-01'), 'MMMM yyyy')}:</strong> {obtenerEstadoPagoMes(empleado, mesActual)}</p>
              </div>
              <div className="empleado-card-footer">
                <button
                  className="btn-secondary"
                  onClick={() => cargarEmpleadoDetalle(empleado.id)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Empleado */}
      {showModalCrear && (
        <div className="modal-overlay" onClick={() => setShowModalCrear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Nuevo Empleado</h2>
              <button className="modal-close" onClick={() => setShowModalCrear(false)}>×</button>
            </div>
            <form onSubmit={handleCrearEmpleado} className="modal-body">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Puesto *</label>
                <select
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value as any })}
                  required
                >
                  <option value="CAJERO">Cajero</option>
                  <option value="DEPOSITO">Depósito</option>
                  <option value="VENDEDOR">Vendedor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Ingreso *</label>
                <input
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sueldo Mensual *</label>
                <input
                  type="number"
                  value={formData.sueldoMensual}
                  onChange={(e) => setFormData({ ...formData, sueldoMensual: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModalCrear(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Crear Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Empleado */}
      {showModalDetalle && empleadoSeleccionado && (
        <div className="modal-overlay modal-large" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-large-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{empleadoSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={() => setShowModalDetalle(false)}>×</button>
            </div>
            <div className="modal-body modal-detalle-body">
              {/* Sección 1: Datos Personales */}
              <section className="seccion-empleado">
                <h3>1. Datos Personales</h3>
                <div className="datos-grid">
                  <div><strong>Nombre:</strong> {empleadoSeleccionado.nombre}</div>
                  <div><strong>DNI:</strong> {empleadoSeleccionado.dni}</div>
                  <div><strong>Teléfono:</strong> {empleadoSeleccionado.telefono || 'N/A'}</div>
                  <div><strong>Dirección:</strong> {empleadoSeleccionado.direccion || 'N/A'}</div>
                  <div><strong>Puesto:</strong> {empleadoSeleccionado.puesto}</div>
                  <div><strong>Fecha de Ingreso:</strong> {format(new Date(empleadoSeleccionado.fechaIngreso), 'dd/MM/yyyy')}</div>
                </div>
              </section>

              {/* Sección 2: Control de Pagos */}
              <section className="seccion-empleado">
                <h3>2. Control de Pagos</h3>
                <div className="control-mes">
                  <label>Mes:</label>
                  <input
                    type="month"
                    value={mesActual}
                    onChange={(e) => setMesActual(e.target.value)}
                  />
                </div>
                <div className="resumen-pago">
                  <div className="resumen-item">
                    <span>Sueldo Mensual:</span>
                    <span>{formatearMonto(empleadoSeleccionado.sueldoMensual)}</span>
                  </div>
                  <div className="resumen-item">
                    <span>Estado del Mes:</span>
                    <span className={`estado-${obtenerEstadoPagoMes(empleadoSeleccionado, mesActual).toLowerCase()}`}>
                      {obtenerEstadoPagoMes(empleadoSeleccionado, mesActual)}
                    </span>
                  </div>
                  <div className="resumen-item">
                    <span>Adelantos del Mes:</span>
                    <span>{formatearMonto(obtenerTotalAdelantosMes(empleadoSeleccionado, mesActual))}</span>
                  </div>
                  <div className="resumen-item">
                    <span>Saldo Pendiente:</span>
                    <span>{formatearMonto(obtenerSaldoPendienteMes(empleadoSeleccionado, mesActual))}</span>
                  </div>
                </div>
                <form onSubmit={handleRegistrarPago} className="form-inline">
                  <input type="month" value={formPago.mes} onChange={(e) => setFormPago({ ...formPago, mes: e.target.value })} required />
                  <input type="number" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} placeholder="Monto" required />
                  <input type="date" value={formPago.fechaPago} onChange={(e) => setFormPago({ ...formPago, fechaPago: e.target.value })} required />
                  <input type="text" value={formPago.observaciones} onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })} placeholder="Observaciones" />
                  <button type="submit" className="btn-primary" disabled={loading}>Registrar Pago</button>
                </form>
                <div className="historial-pagos">
                  <h4>Historial de Pagos</h4>
                  <div className="tabla-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>Monto</th>
                          <th>Fecha Pago</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadoSeleccionado.pagos.length === 0 ? (
                          <tr><td colSpan={4}>No hay pagos registrados</td></tr>
                        ) : (
                          empleadoSeleccionado.pagos.map((pago) => (
                            <tr key={pago.id}>
                              <td>{pago.mes}</td>
                              <td>{formatearMonto(pago.monto)}</td>
                              <td>{format(new Date(pago.fechaPago), 'dd/MM/yyyy')}</td>
                              <td>{pago.observaciones || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Sección 3: Adelantos */}
              <section className="seccion-empleado">
                <h3>3. Adelantos</h3>
                <div className="resumen-adelantos">
                  <div className="resumen-item">
                    <span>Adelantos del Mes ({format(new Date(mesActual + '-01'), 'MMMM yyyy')}):</span>
                    <span>{formatearMonto(obtenerTotalAdelantosMes(empleadoSeleccionado, mesActual))}</span>
                  </div>
                  <div className="resumen-item">
                    <span>Cuánto le queda por cobrar:</span>
                    <span>{formatearMonto(obtenerSaldoPendienteMes(empleadoSeleccionado, mesActual))}</span>
                  </div>
                </div>
                <form onSubmit={handleRegistrarAdelanto} className="form-inline">
                  <input type="date" value={formAdelanto.fecha} onChange={(e) => setFormAdelanto({ ...formAdelanto, fecha: e.target.value })} required />
                  <input type="number" value={formAdelanto.monto} onChange={(e) => setFormAdelanto({ ...formAdelanto, monto: e.target.value })} placeholder="Monto" required />
                  <input type="month" value={formAdelanto.mesAplicado} onChange={(e) => setFormAdelanto({ ...formAdelanto, mesAplicado: e.target.value })} required />
                  <input type="text" value={formAdelanto.observaciones} onChange={(e) => setFormAdelanto({ ...formAdelanto, observaciones: e.target.value })} placeholder="Observaciones" />
                  <button type="submit" className="btn-primary" disabled={loading}>Registrar Adelanto</button>
                </form>
                <div className="historial-adelantos">
                  <h4>Registro de Adelantos</h4>
                  <div className="tabla-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Mes Aplicado</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadoSeleccionado.adelantos.length === 0 ? (
                          <tr><td colSpan={4}>No hay adelantos registrados</td></tr>
                        ) : (
                          empleadoSeleccionado.adelantos.map((adelanto) => (
                            <tr key={adelanto.id}>
                              <td>{format(new Date(adelanto.fecha), 'dd/MM/yyyy')}</td>
                              <td>{formatearMonto(adelanto.monto)}</td>
                              <td>{adelanto.mesAplicado}</td>
                              <td>{adelanto.observaciones || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Sección 4: Asistencia */}
              <section className="seccion-empleado">
                <h3>4. Asistencia</h3>
                <div className="resumen-asistencia">
                  <div className="resumen-item">
                    <span>Días Trabajados ({format(new Date(mesActual + '-01'), 'MMMM yyyy')}):</span>
                    <span>{obtenerDiasTrabajadosMes(empleadoSeleccionado, mesActual)}</span>
                  </div>
                  <div className="resumen-item">
                    <span>Faltas:</span>
                    <span>{obtenerFaltasMes(empleadoSeleccionado, mesActual)}</span>
                  </div>
                </div>
                <form onSubmit={handleRegistrarAsistencia} className="form-inline">
                  <input type="date" value={formAsistencia.fecha} onChange={(e) => setFormAsistencia({ ...formAsistencia, fecha: e.target.value })} required />
                  <label>
                    <input type="checkbox" checked={formAsistencia.presente} onChange={(e) => setFormAsistencia({ ...formAsistencia, presente: e.target.checked })} />
                    Presente
                  </label>
                  <input type="text" value={formAsistencia.observaciones} onChange={(e) => setFormAsistencia({ ...formAsistencia, observaciones: e.target.value })} placeholder="Observaciones" />
                  <button type="submit" className="btn-primary" disabled={loading}>Registrar Asistencia</button>
                </form>
              </section>

              {/* Sección 5: Documentos */}
              <section className="seccion-empleado">
                <h3>5. Documentos Básicos</h3>
                <form onSubmit={handleAgregarDocumento} className="form-inline">
                  <select value={formDocumento.tipo} onChange={(e) => setFormDocumento({ ...formDocumento, tipo: e.target.value as any })} required>
                    <option value="DNI">DNI</option>
                    <option value="CONTRATO">Contrato Laboral</option>
                  </select>
                  <input type="text" value={formDocumento.nombre} onChange={(e) => setFormDocumento({ ...formDocumento, nombre: e.target.value })} placeholder="Nombre del archivo" required />
                  <input type="text" value={formDocumento.url} onChange={(e) => setFormDocumento({ ...formDocumento, url: e.target.value })} placeholder="URL o path del archivo" required />
                  <input type="date" value={formDocumento.fechaSubida} onChange={(e) => setFormDocumento({ ...formDocumento, fechaSubida: e.target.value })} required />
                  <button type="submit" className="btn-primary" disabled={loading}>Agregar Documento</button>
                </form>
                <div className="lista-documentos">
                  {empleadoSeleccionado.documentos.length === 0 ? (
                    <p>No hay documentos registrados</p>
                  ) : (
                    <div className="documentos-grid">
                      {empleadoSeleccionado.documentos.map((doc) => (
                        <div key={doc.id} className="documento-item">
                          <div className="documento-tipo">{doc.tipo}</div>
                          <div className="documento-nombre">{doc.nombre}</div>
                          <div className="documento-fecha">{format(new Date(doc.fechaSubida), 'dd/MM/yyyy')}</div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-link">Ver</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModalDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpleadosPage;

