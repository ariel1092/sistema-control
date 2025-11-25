import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { gastosApi } from '../services/api';
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

function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [resumen, setResumen] = useState<ResumenGastos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    categoria: 'OTROS',
    monto: '',
    descripcion: '',
    empleadoNombre: '',
    metodoPago: 'EFECTIVO',
    observaciones: '',
  });

  const fechaHoy = useMemo(() => new Date(), []);
  const inicioMes = useMemo(() => startOfMonth(fechaHoy), [fechaHoy]);
  const finMes = useMemo(() => endOfMonth(fechaHoy), [fechaHoy]);

  useEffect(() => {
    cargarDatos();
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

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await gastosApi.crear(formData);
      setMostrarModal(false);
      setFormData({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        categoria: 'OTROS',
        monto: '',
        descripcion: '',
        empleadoNombre: '',
        metodoPago: 'EFECTIVO',
        observaciones: '',
      });
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
      OTROS: 'Otros',
    };
    return labels[cat] || cat;
  };

  const getMetodoPagoLabel = (metodo: string) => {
    const labels: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      CAJA: 'Caja',
      MERCADOPAGO: 'MercadoPago',
      TRANSFERENCIA: 'Transferencia',
    };
    return labels[metodo] || metodo;
  };

  return (
    <div className="gastos-page">
      <div className="gastos-header">
        <h1 className="page-title">💸 Gastos Diarios</h1>
        <button className="btn-primary" onClick={() => setMostrarModal(true)}>
          + Registrar Gasto
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {loading && !resumen ? (
        <div className="loading-container">
          <div className="loading-spinner">Cargando...</div>
        </div>
      ) : (
        <>
          {/* Cards de Resumen */}
          <div className="resumen-cards">
            <div className="resumen-card">
              <div className="card-label">Total Hoy</div>
              <div className="card-value">{formatearMonto(resumen?.totalHoy || 0)}</div>
            </div>
            <div className="resumen-card">
              <div className="card-label">Total Mes</div>
              <div className="card-value">{formatearMonto(resumen?.totalMes || 0)}</div>
            </div>
            <div className="resumen-card">
              <div className="card-label">Gasto Más Alto</div>
              <div className="card-value">
                {resumen?.gastoMasAlto
                  ? `${formatearMonto(resumen.gastoMasAlto.monto)} (${getCategoriaLabel(resumen.gastoMasAlto.categoria).toLowerCase()})`
                  : formatearMonto(0)}
              </div>
            </div>
            <div className="resumen-card">
              <div className="card-label">Snacks Hoy</div>
              <div className="card-value">{formatearMonto(resumen?.snacksHoy || 0)}</div>
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
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Gasto</h2>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>×</button>
            </div>
            <form onSubmit={handleCrearGasto} className="modal-body">
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                >
                  <option value="FLETE">Flete</option>
                  <option value="SNACK">Snack</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="LIMPIEZA">Limpieza</option>
                  <option value="OTROS">Otros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Flete de materiales"
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
                <label>Método de Pago *</label>
                <select
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                  required
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="CAJA">Caja</option>
                  <option value="MERCADOPAGO">MercadoPago</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
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
                <button type="button" className="btn-secondary" onClick={() => setMostrarModal(false)}>
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
    </div>
  );
}

export default GastosPage;

