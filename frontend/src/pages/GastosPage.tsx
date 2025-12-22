import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { gastosApi, retirosApi } from '../services/api';
import Loading from '../components/common/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GastosPage.css';

interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  monto: number;
  descripcion: string;
  empleadoNombre?: string;
  metodoPago: string;
  observaciones?: string;
}

interface ResumenGastos {
  total: number;
  totalHoy: number;
  totalMes: number;
  gastoMasAlto: {
    monto: number;
    descripcion: string;
    categoria: string;
  } | null;
  snacksHoy: number;
  porCategoria: Array<{ categoria: string; total: number }>;
}

interface RetiroSocio {
  id: string;
  fecha: string;
  cuentaBancaria: 'ABDUL' | 'OSVALDO';
  monto: number;
  descripcion: string;
  observaciones?: string;
  createdAt: string;
}

function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [resumen, setResumen] = useState<ResumenGastos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalRetiro, setMostrarModalRetiro] = useState(false);
  const [retiros, setRetiros] = useState<RetiroSocio[]>([]);
  const [retirosHistorial, setRetirosHistorial] = useState<RetiroSocio[]>([]);
  const [loadingHistorialRetiros, setLoadingHistorialRetiros] = useState(false);
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    categoria: 'OTROS',
    monto: '',
    descripcion: '',
    empleadoNombre: '',
    metodoPago: 'EFECTIVO' as 'EFECTIVO' | 'MERCADOPAGO',
    cuentaBancaria: '' as '' | 'ABDUL' | 'OSVALDO',
    observaciones: '',
  });
  const [formRetiro, setFormRetiro] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: format(new Date(), 'HH:mm'),
    cuentaBancaria: 'ABDUL' as 'ABDUL' | 'OSVALDO',
    monto: '',
    descripcion: 'Retiro semanal',
    observaciones: '',
  });

  const fechaHoy = useMemo(() => new Date(), []);
  const inicioMes = useMemo(() => startOfMonth(fechaHoy), [fechaHoy]);
  const finMes = useMemo(() => endOfMonth(fechaHoy), [fechaHoy]);
  const inicioSemana = useMemo(() => startOfWeek(fechaHoy, { weekStartsOn: 1 }), [fechaHoy]);
  const finSemana = useMemo(() => endOfWeek(fechaHoy, { weekStartsOn: 1 }), [fechaHoy]);
  const inicioHistorialRetiros = useMemo(() => subDays(fechaHoy, 90), [fechaHoy]);

  const resetFormData = () => {
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      categoria: 'OTROS',
      monto: '',
      descripcion: '',
      empleadoNombre: '',
      metodoPago: 'EFECTIVO',
      cuentaBancaria: '',
      observaciones: '',
    });
  };

  useEffect(() => {
    cargarDatos();
    cargarRetiros();
    cargarHistorialRetiros();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar resumen
      const resumenResponse = await gastosApi.obtenerResumen(
        format(inicioMes, 'yyyy-MM-dd'),
        format(finMes, 'yyyy-MM-dd')
      );
      setResumen(resumenResponse.data);

      // Cargar últimos gastos
      const gastosResponse = await gastosApi.obtenerTodos(
        format(inicioMes, 'yyyy-MM-dd'),
        format(finMes, 'yyyy-MM-dd')
      );
      setGastos(gastosResponse.data.slice(0, 20)); // Últimos 20
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarRetiros = async () => {
    try {
      const response = await retirosApi.obtenerTodos(
        format(inicioSemana, 'yyyy-MM-dd'),
        format(finSemana, 'yyyy-MM-dd')
      );
      setRetiros(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar retiros:', err);
    }
  };

  const cargarHistorialRetiros = async () => {
    try {
      setLoadingHistorialRetiros(true);
      const response = await retirosApi.obtenerTodos(
        format(inicioHistorialRetiros, 'yyyy-MM-dd'),
        format(fechaHoy, 'yyyy-MM-dd')
      );
      setRetirosHistorial(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar historial de retiros:', err);
    } finally {
      setLoadingHistorialRetiros(false);
    }
  };

  const handleCrearRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const montoRetiro = parseFloat(formRetiro.monto);

      await retirosApi.crear({
        fecha: formRetiro.fecha,
        hora: formRetiro.hora,
        cuentaBancaria: formRetiro.cuentaBancaria,
        monto: montoRetiro,
        descripcion: formRetiro.descripcion,
        observaciones: formRetiro.observaciones || undefined,
      });
      
      setSuccess('Retiro registrado exitosamente');
      setMostrarModalRetiro(false);
      setFormRetiro({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora: format(new Date(), 'HH:mm'),
        cuentaBancaria: 'ABDUL',
        monto: '',
        descripcion: 'Retiro semanal',
        observaciones: '',
      });
      await cargarRetiros();
      await cargarHistorialRetiros();

      // Notificar a los reportes que hay un nuevo retiro
      console.log('GastosPage: Disparando evento retiroRegistrado...');
      const evento = new CustomEvent('retiroRegistrado', { 
        detail: { monto: montoRetiro, cuentaBancaria: formRetiro.cuentaBancaria },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(evento);
      console.log('GastosPage: Evento retiroRegistrado disparado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrar retiro');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const dataToSend: any = {
        ...formData,
        monto: parseFloat(formData.monto),
      };
      // Solo incluir cuentaBancaria si el método de pago es MercadoPago
      if (formData.metodoPago === 'MERCADOPAGO') {
        if (!formData.cuentaBancaria) {
          setError('Debe seleccionar una cuenta bancaria cuando el método de pago es MercadoPago');
          setLoading(false);
          return;
        }
        dataToSend.cuentaBancaria = formData.cuentaBancaria;
      } else {
        // Remover cuentaBancaria si no es MercadoPago
        delete dataToSend.cuentaBancaria;
      }
      await gastosApi.crear(dataToSend);
      setMostrarModal(false);
      resetFormData();
      await cargarDatos();
      
      // Notificar a los reportes que hay un nuevo gasto
      console.log('GastosPage: Disparando evento gastoRegistrado...');
      const evento = new CustomEvent('gastoRegistrado', { 
        detail: { monto: parseFloat(formData.monto), categoria: formData.categoria },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(evento);
      console.log('GastosPage: Evento gastoRegistrado disparado');
    } catch (err: any) {
      setError(err.message || 'Error al crear gasto');
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const getCategoriaLabel = (cat: string) => {
    const labels: Record<string, string> = {
      FLETE: 'Fletes',
      SNACK: 'Snacks',
      MANTENIMIENTO: 'Mantenimiento',
      LIMPIEZA: 'Limpieza',
      MERCADERIA: 'Mercadería',
      OTROS: 'Otros',
    };
    return labels[cat] || cat;
  };

  const getMetodoPagoLabel = (metodo: string) => {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      MERCADOPAGO: 'MercadoPago',
    };
    return labels[metodo] || metodo;
  };

  return (
    <div className="gastos-page">
      <div className="gastos-header">
        <div>
          <h1 className="page-title">💸 Gastos Diarios</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Control y registro de gastos operativos del negocio
          </p>
        </div>
        <button className="btn-primary" onClick={() => setMostrarModal(true)}>
          ➕ Registrar Gasto
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {loading && !resumen ? (
        <Loading mensaje="Cargando información de gastos..." />
      ) : (
        <>
          {/* Cards de Resumen */}
          <div className="resumen-cards">
            <div className="resumen-card">
              <div className="card-label">💰 Total Hoy</div>
              <div className="card-value">{formatearMonto(resumen?.totalHoy || 0)}</div>
            </div>
            <div className="resumen-card">
              <div className="card-label">📅 Total Mes</div>
              <div className="card-value">{formatearMonto(resumen?.totalMes || 0)}</div>
            </div>
            <div className="resumen-card">
              <div className="card-label">📈 Gasto Más Alto</div>
              <div className="card-value">
                {resumen?.gastoMasAlto
                  ? `${formatearMonto(resumen.gastoMasAlto.monto)}`
                  : formatearMonto(0)}
              </div>
              {resumen?.gastoMasAlto && (
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  {getCategoriaLabel(resumen.gastoMasAlto.categoria)}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico por Categoría */}
          <div className="chart-section">
            <h2 className="section-title">Gastos por Categoría (Mes Actual)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resumen?.porCategoria.map(c => ({
                  categoria: getCategoriaLabel(c.categoria),
                  total: c.total,
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatearMonto(value)} />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sección Retiros de Socios */}
          <div className="retiros-section">
            <div className="section-header-retiros">
              <h2 className="section-title">👥 Retiros de Socios (Semana Actual)</h2>
              <button className="btn-primary btn-sm" onClick={() => setMostrarModalRetiro(true)}>
                ➕ Registrar Retiro
              </button>
            </div>
            <div className="retiros-grid">
              {retiros.length > 0 ? (
                retiros.map((retiro) => (
                  <div key={retiro.id} className="retiro-card">
                    <div className="retiro-header">
                      <div className={`retiro-badge ${retiro.cuentaBancaria.toLowerCase()}`}>
                        {retiro.cuentaBancaria}
                      </div>
                      <div className="retiro-monto">{formatearMonto(retiro.monto)}</div>
                    </div>
                    <div className="retiro-body">
                      <div className="retiro-info">
                        <span className="retiro-label">Fecha y Hora:</span>
                        <span className="retiro-value">
                          {format(new Date(retiro.fecha), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="retiro-info">
                        <span className="retiro-label">Socio:</span>
                        <span className="retiro-value">{retiro.cuentaBancaria}</span>
                      </div>
                      <div className="retiro-info">
                        <span className="retiro-label">Descripción:</span>
                        <span className="retiro-value">{retiro.descripcion}</span>
                      </div>
                      {retiro.observaciones && (
                        <div className="retiro-info">
                          <span className="retiro-label">Observaciones:</span>
                          <span className="retiro-value">{retiro.observaciones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="retiros-empty">
                  <p>No hay retiros registrados esta semana</p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de Retiros */}
          <div className="gastos-table-section" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>📋 Historial de Retiros (Últimos 90 días)</h2>
              <button
                className="btn-secondary btn-sm"
                onClick={cargarHistorialRetiros}
                disabled={loadingHistorialRetiros}
              >
                {loadingHistorialRetiros ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            <div className="table-container" style={{ marginTop: 16 }}>
              <table className="gastos-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Socio</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {retirosHistorial.length > 0 ? (
                    retirosHistorial.slice(0, 50).map((retiro) => (
                      <tr key={retiro.id}>
                        <td>{format(new Date(retiro.fecha), 'dd/MM/yyyy HH:mm')}</td>
                        <td>{retiro.cuentaBancaria}</td>
                        <td className="monto-cell">{formatearMonto(retiro.monto)}</td>
                        <td>{retiro.descripcion}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                        No hay retiros registrados en los últimos 90 días
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {retirosHistorial.length > 50 && (
              <div style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
                Mostrando 50 de {retirosHistorial.length}. Ajustá el rango si necesitás ver más.
              </div>
            )}
          </div>

          {/* Tabla de Últimos Gastos */}
          <div className="gastos-table-section">
            <h2 className="section-title">Últimos Gastos Registrados</h2>
            <div className="table-container">
              <table className="gastos-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                    <th>Empleado</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.length > 0 ? (
                    gastos.map((gasto) => (
                      <tr key={gasto.id}>
                        <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                        <td>{getCategoriaLabel(gasto.categoria)}</td>
                        <td className="monto-cell">{formatearMonto(gasto.monto)}</td>
                        <td>{gasto.empleadoNombre || 'N/A'}</td>
                        <td>{getMetodoPagoLabel(gasto.metodoPago)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                        No hay gastos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Registrar Gasto */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => {
          setMostrarModal(false);
          resetFormData();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Gasto</h2>
              <button className="modal-close" onClick={() => {
                setMostrarModal(false);
                resetFormData();
              }}>×</button>
            </div>
            <form onSubmit={handleCrearGasto} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  >
                    <option value="FLETE">🚚 Flete</option>
                    <option value="SNACK">🍿 Snack</option>
                    <option value="MANTENIMIENTO">🔧 Mantenimiento</option>
                    <option value="LIMPIEZA">🧹 Limpieza</option>
                    <option value="MERCADERIA">📦 Mercadería</option>
                    <option value="OTROS">📦 Otros</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Monto</label>
                  <input
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Método de Pago</label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => {
                      const nuevoMetodoPago = e.target.value as 'EFECTIVO' | 'MERCADOPAGO';
                      setFormData({ 
                        ...formData, 
                        metodoPago: nuevoMetodoPago,
                        cuentaBancaria: nuevoMetodoPago === 'EFECTIVO' ? '' : formData.cuentaBancaria
                      });
                    }}
                    required
                  >
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="MERCADOPAGO">💳 MercadoPago</option>
                  </select>
                </div>
              </div>

              {formData.metodoPago === 'MERCADOPAGO' && (
                <div className="form-group">
                  <label className="form-label-required">Cuenta Bancaria</label>
                  <div className="radio-card-group">
                    <label className={`radio-card ${formData.cuentaBancaria === 'ABDUL' ? 'radio-card-selected' : ''}`}>
                      <input
                        type="radio"
                        name="cuentaBancaria"
                        value="ABDUL"
                        checked={formData.cuentaBancaria === 'ABDUL'}
                        onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value as 'ABDUL' })}
                        required={formData.metodoPago === 'MERCADOPAGO'}
                        className="radio-card-input"
                      />
                      <div className="radio-card-content">
                        <div className="radio-card-icon">👤</div>
                        <div className="radio-card-label">Cuenta A (Abdul)</div>
                      </div>
                    </label>
                    <label className={`radio-card ${formData.cuentaBancaria === 'OSVALDO' ? 'radio-card-selected' : ''}`}>
                      <input
                        type="radio"
                        name="cuentaBancaria"
                        value="OSVALDO"
                        checked={formData.cuentaBancaria === 'OSVALDO'}
                        onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value as 'OSVALDO' })}
                        required={formData.metodoPago === 'MERCADOPAGO'}
                        className="radio-card-input"
                      />
                      <div className="radio-card-content">
                        <div className="radio-card-icon">👤</div>
                        <div className="radio-card-label">Cuenta O (Osvaldo)</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label-required">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Flete de materiales, Compra de snacks..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Empleado</label>
                <input
                  type="text"
                  value={formData.empleadoNombre}
                  onChange={(e) => setFormData({ ...formData, empleadoNombre: e.target.value })}
                  placeholder="Nombre del empleado (opcional)"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => {
                  setMostrarModal(false);
                  resetFormData();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Retiro */}
      {mostrarModalRetiro && (
        <div className="modal-overlay" onClick={() => setMostrarModalRetiro(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👥 Registrar Retiro de Socio</h2>
              <button className="modal-close" onClick={() => setMostrarModalRetiro(false)}>×</button>
            </div>
            <form onSubmit={handleCrearRetiro} className="modal-body">
              <div className="form-group">
                <label className="form-label-required">Socio</label>
                <select
                  value={formRetiro.cuentaBancaria}
                  onChange={(e) => setFormRetiro({ ...formRetiro, cuentaBancaria: e.target.value as 'ABDUL' | 'OSVALDO' })}
                  required
                >
                  <option value="ABDUL">👤 Abdul</option>
                  <option value="OSVALDO">👤 Osvaldo</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Fecha</label>
                  <input
                    type="date"
                    value={formRetiro.fecha}
                    onChange={(e) => setFormRetiro({ ...formRetiro, fecha: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Hora</label>
                  <input
                    type="time"
                    value={formRetiro.hora}
                    onChange={(e) => setFormRetiro({ ...formRetiro, hora: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label-required">Monto</label>
                  <input
                    type="number"
                    value={formRetiro.monto}
                    onChange={(e) => setFormRetiro({ ...formRetiro, monto: e.target.value })}
                    placeholder="0"
                    required
                  />
              </div>

              <div className="form-group">
                <label className="form-label-required">Descripción</label>
                <input
                  type="text"
                  value={formRetiro.descripcion}
                  onChange={(e) => setFormRetiro({ ...formRetiro, descripcion: e.target.value })}
                  placeholder="Ej: Retiro semanal"
                  required
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formRetiro.observaciones}
                  onChange={(e) => setFormRetiro({ ...formRetiro, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setMostrarModalRetiro(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GastosPage;


