import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cajaApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './CajaPage.css';

interface ResumenCaja {
  id?: string;
  fecha: string;
  estado: 'ABIERTO' | 'CERRADO';
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalGeneral: number;
  cantidadVentas: number;
  observaciones?: string;
}

interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'SALIDA';
  monto: number;
  motivo: string;
  createdAt: string;
}

function CajaPage() {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resumen, setResumen] = useState<ResumenCaja | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para modales
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [mostrarCerrarCaja, setMostrarCerrarCaja] = useState(false);
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Estados para formularios
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'SALIDA'>('INGRESO');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState('');
  
  // Estados para historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [fechaFinHistorial, setFechaFinHistorial] = useState(format(new Date(), 'yyyy-MM-dd'));

  const cargarResumen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cajaApi.obtenerResumen(fecha);
      setResumen(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar resumen');
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  const handleAbrirCaja = async () => {
    if (!user?.id) {
      setError('Debe estar autenticado para abrir la caja');
      return;
    }

    if (!montoInicial || parseFloat(montoInicial) < 0) {
      setError('Ingrese un monto inicial válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cajaApi.abrirCaja(parseFloat(montoInicial), user.id);
      setSuccess('Caja abierta exitosamente');
      setMostrarAbrirCaja(false);
      setMontoInicial('');
      await cargarResumen();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!user?.id) {
      setError('Debe estar autenticado para cerrar la caja');
      return;
    }

    if (!montoFinal || parseFloat(montoFinal) < 0) {
      setError('Ingrese un monto final válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cajaApi.cerrarCaja(
        {
          montoFinal: parseFloat(montoFinal),
          observaciones: observacionesCierre || undefined,
        },
        user.id
      );
      setSuccess('Caja cerrada exitosamente');
      setMostrarCerrarCaja(false);
      setMontoFinal('');
      setObservacionesCierre('');
      await cargarResumen();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearMovimiento = async () => {
    if (!user?.id) {
      setError('Debe estar autenticado para crear un movimiento');
      return;
    }

    if (!montoMovimiento || parseFloat(montoMovimiento) <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      return;
    }

    if (!motivoMovimiento.trim()) {
      setError('Ingrese un motivo para el movimiento');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cajaApi.crearMovimiento(
        {
          tipo: tipoMovimiento,
          monto: parseFloat(montoMovimiento),
          motivo: motivoMovimiento,
        },
        user.id
      );
      setSuccess('Movimiento registrado exitosamente');
      setMostrarMovimiento(false);
      setMontoMovimiento('');
      setMotivoMovimiento('');
      await cargarResumen();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await cajaApi.obtenerHistorial(fechaInicioHistorial, fechaFinHistorial);
      setHistorial(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mostrarHistorial) {
      cargarHistorial();
    }
  }, [mostrarHistorial, fechaInicioHistorial, fechaFinHistorial]);

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const calcularDiferencia = () => {
    if (!resumen || !montoFinal) return 0;
    const esperado = resumen.totalEfectivo;
    const contado = parseFloat(montoFinal);
    return contado - esperado;
  };

  return (
    <div className="caja-page">
      <div className="caja-header">
        <h1 className="page-title">💰 Control de Caja</h1>
        <p className="page-subtitle">Gestión de apertura, cierre y movimientos de caja</p>
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

      {/* Controles principales */}
      <div className="caja-controls">
        <div className="control-group">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="control-buttons">
          {resumen?.estado === 'ABIERTO' ? (
            <>
              <button
                className="btn btn-danger"
                onClick={() => setMostrarCerrarCaja(true)}
                disabled={loading}
              >
                🔒 Cerrar Caja
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarMovimiento(true)}
                disabled={loading}
              >
                ➕ Movimiento Manual
              </button>
            </>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => setMostrarAbrirCaja(true)}
              disabled={loading}
            >
              🔓 Abrir Caja
            </button>
          )}
          <button
            className="btn btn-info"
            onClick={() => setMostrarHistorial(true)}
            disabled={loading}
          >
            📋 Historial
          </button>
        </div>
      </div>

      {/* Estado de Caja */}
      {resumen && (
        <div className="caja-status-card">
          <div className="status-header">
            <div className={`status-badge status-${resumen.estado.toLowerCase()}`}>
              {resumen.estado === 'ABIERTO' ? '🔓 ABIERTA' : '🔒 CERRADA'}
            </div>
            <span className="status-date">{format(new Date(resumen.fecha), 'dd/MM/yyyy')}</span>
          </div>
        </div>
      )}

      {/* Arqueo / Resumen */}
      {resumen && (
        <div className="caja-resumen-section">
          <h2 className="section-title">📊 Arqueo del Día</h2>
          <div className="resumen-grid">
            <div className="resumen-card efectivo">
              <div className="card-icon">💵</div>
              <div className="card-content">
                <div className="card-label">Efectivo</div>
                <div className="card-value">{formatearMonto(resumen.totalEfectivo)}</div>
              </div>
            </div>
            <div className="resumen-card tarjeta">
              <div className="card-icon">💳</div>
              <div className="card-content">
                <div className="card-label">Tarjeta/Transferencia</div>
                <div className="card-value">{formatearMonto(resumen.totalTarjeta + resumen.totalTransferencia)}</div>
              </div>
            </div>
            <div className="resumen-card total">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-label">Total General</div>
                <div className="card-value">{formatearMonto(resumen.totalGeneral)}</div>
              </div>
            </div>
            <div className="resumen-card ventas">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-label">Cantidad de Ventas</div>
                <div className="card-value">{resumen.cantidadVentas}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abrir Caja */}
      {mostrarAbrirCaja && (
        <div className="modal-overlay" onClick={() => setMostrarAbrirCaja(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔓 Abrir Caja</h2>
              <button className="modal-close" onClick={() => setMostrarAbrirCaja(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Monto Inicial en Efectivo *</label>
                  <input
                    type="number"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarAbrirCaja(false)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleAbrirCaja} disabled={loading}>
                {loading ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {mostrarCerrarCaja && (
        <div className="modal-overlay" onClick={() => setMostrarCerrarCaja(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Cerrar Caja</h2>
              <button className="modal-close" onClick={() => setMostrarCerrarCaja(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <div className="info-item">
                  <span className="info-label">Total Esperado (Efectivo):</span>
                  <span className="info-value">{formatearMonto(resumen?.totalEfectivo || 0)}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Monto Final Contado *</label>
                  <input
                    type="number"
                    value={montoFinal}
                    onChange={(e) => setMontoFinal(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
              </div>
              {montoFinal && parseFloat(montoFinal) > 0 && (
                <div className={`diferencia-box ${calcularDiferencia() >= 0 ? 'positiva' : 'negativa'}`}>
                  <span className="diferencia-label">Diferencia:</span>
                  <span className="diferencia-value">{formatearMonto(calcularDiferencia())}</span>
                </div>
              )}
              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Notas sobre el cierre..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarCerrarCaja(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleCerrarCaja} disabled={loading}>
                {loading ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento Manual */}
      {mostrarMovimiento && (
        <div className="modal-overlay" onClick={() => setMostrarMovimiento(false)}>
          <div className="modal-content modal-movimiento" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Movimiento</h2>
              <button className="modal-close" onClick={() => setMostrarMovimiento(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label-required">Tipo de Movimiento</label>
                <div className="tipo-movimiento-selector">
                  <button
                    type="button"
                    className={`tipo-option ${tipoMovimiento === 'INGRESO' ? 'active ingreso' : ''}`}
                    onClick={() => setTipoMovimiento('INGRESO')}
                  >
                    <div className="tipo-icon">💰</div>
                    <div className="tipo-content">
                      <div className="tipo-title">Ingreso</div>
                      <div className="tipo-subtitle">Dinero que entra a la caja</div>
                    </div>
                    {tipoMovimiento === 'INGRESO' && (
                      <div className="tipo-check">✓</div>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`tipo-option ${tipoMovimiento === 'SALIDA' ? 'active salida' : ''}`}
                    onClick={() => setTipoMovimiento('SALIDA')}
                  >
                    <div className="tipo-icon">💸</div>
                    <div className="tipo-content">
                      <div className="tipo-title">Salida</div>
                      <div className="tipo-subtitle">Dinero que sale de la caja</div>
                    </div>
                    {tipoMovimiento === 'SALIDA' && (
                      <div className="tipo-check">✓</div>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label-required">Monto</label>
                <input
                  type="number"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                  placeholder="0"
                  className="input-monto-simple"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label className="form-label-required">Motivo o Descripción</label>
                <textarea
                  value={motivoMovimiento}
                  onChange={(e) => setMotivoMovimiento(e.target.value)}
                  placeholder="Ej: Compra de materiales, Aporte del dueño, Pago a proveedor..."
                  rows={4}
                  className="textarea-movimiento"
                />
                <div className="input-hint">
                  Describe claramente el motivo del movimiento para mantener un registro detallado
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarMovimiento(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary btn-registrar" 
                onClick={handleCrearMovimiento} 
                disabled={loading || !montoMovimiento || !motivoMovimiento.trim()}
              >
                {loading ? 'Guardando...' : 'Registrar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {mostrarHistorial && (
        <div className="modal-overlay modal-large" onClick={() => setMostrarHistorial(false)}>
          <div className="modal-content modal-large-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Historial de Cajas</h2>
              <button className="modal-close" onClick={() => setMostrarHistorial(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="historial-filters">
                <div className="form-group">
                  <label>Desde</label>
                  <input
                    type="date"
                    value={fechaInicioHistorial}
                    onChange={(e) => setFechaInicioHistorial(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Hasta</label>
                  <input
                    type="date"
                    value={fechaFinHistorial}
                    onChange={(e) => setFechaFinHistorial(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={cargarHistorial} disabled={loading}>
                  🔍 Buscar
                </button>
              </div>
              <div className="historial-table-container">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Efectivo</th>
                      <th>Tarjeta/Transf.</th>
                      <th>Total</th>
                      <th>Ventas</th>
                      <th>Movimientos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center">
                          No hay registros en el rango seleccionado
                        </td>
                      </tr>
                    ) : (
                      historial.map((item) => (
                        <tr key={item.id}>
                          <td>{format(new Date(item.fecha), 'dd/MM/yyyy')}</td>
                          <td>
                            <span className={`badge badge-${item.estado.toLowerCase()}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td>{formatearMonto(item.totalEfectivo)}</td>
                          <td>{formatearMonto(item.totalTarjeta + item.totalTransferencia)}</td>
                          <td className="font-bold">{formatearMonto(item.totalGeneral)}</td>
                          <td>{item.cantidadVentas}</td>
                          <td>{item.movimientos?.length || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarHistorial(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !resumen && (
        <div className="loading-container">
          <div className="loading-spinner">Cargando...</div>
        </div>
      )}
    </div>
  );
}

export default CajaPage;
