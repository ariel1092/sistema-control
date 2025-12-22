import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { reportesApi } from '../../services/api';
import { formatearMoneda } from '../../utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Reportes.css';

interface ReporteFinancieroProps {
  fechaInicio: string;
  fechaFin: string;
}

function ReporteFinanciero({ fechaInicio, fechaFin }: ReporteFinancieroProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportesApi.financiero(fechaInicio, fechaFin);
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el reporte financiero');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarDatos();
    }, 300); // Debounce de 300ms para evitar múltiples llamadas

    return () => clearTimeout(timeoutId);
  }, [cargarDatos]);

  // Usar ref para mantener la función cargarDatos actualizada sin recrear listeners
  const cargarDatosRef = useRef(cargarDatos);
  useEffect(() => {
    cargarDatosRef.current = cargarDatos;
  }, [cargarDatos]);

  // Escuchar eventos de ventas para actualizar en tiempo real
  useEffect(() => {
    const handleVentaRegistrada = () => {
      console.log('ReporteFinanciero: Evento ventaRegistrada recibido, actualizando...');
      cargarDatosRef.current();
    };
    
    const handleVentaCancelada = () => {
      console.log('ReporteFinanciero: Evento ventaCancelada recibido, actualizando...');
      cargarDatosRef.current();
    };

    const handleGastoRegistrado = () => {
      console.log('ReporteFinanciero: Evento gastoRegistrado recibido, actualizando...');
      cargarDatosRef.current();
    };

    const handleRetiroRegistrado = () => {
      console.log('ReporteFinanciero: Evento retiroRegistrado recibido, actualizando...');
      cargarDatosRef.current();
    };

    window.addEventListener('ventaRegistrada', handleVentaRegistrada);
    window.addEventListener('ventaCancelada', handleVentaCancelada);
    window.addEventListener('gastoRegistrado', handleGastoRegistrado);
    window.addEventListener('retiroRegistrado', handleRetiroRegistrado);

    return () => {
      window.removeEventListener('ventaRegistrada', handleVentaRegistrada);
      window.removeEventListener('ventaCancelada', handleVentaCancelada);
      window.removeEventListener('gastoRegistrado', handleGastoRegistrado);
      window.removeEventListener('retiroRegistrado', handleRetiroRegistrado);
    };
  }, []);

  if (loading) return <div className="loading">Cargando reporte financiero...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <div className="reporte-container">
      <h2>💰 Reporte Financiero Consolidado</h2>

      {/* Cards de Resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Total General</div>
            <div className="card-value ingresos">{formatearMoneda(data.totalIngresos)}</div>
            <div className="card-subvalue">Suma de todas las ventas</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <div className="card-label">Total Gastos</div>
            <div className="card-value gastos">{formatearMoneda(data.totalGastos)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <div className="card-label">Total Retiros</div>
            <div className="card-value retiros">{formatearMoneda(data.totalRetiros)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-label">Balance General</div>
            <div className={`card-value ${data.balanceGeneral >= 0 ? 'positivo' : 'negativo'}`}>
              {formatearMoneda(data.balanceGeneral)}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Ganancia Neta</div>
            <div className={`card-value ${data.gananciaNeta >= 0 ? 'positivo' : 'negativo'}`}>
              {formatearMoneda(data.gananciaNeta)}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-label">Margen de Ganancia</div>
            <div className="card-value">{data.margenGanancia.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Tendencia de Ingresos vs Gastos (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.tendenciaIngresos.map((item: any, index: number) => ({
              fecha: format(new Date(item.fecha), 'dd/MM'),
              ingresos: item.monto,
              gastos: data.tendenciaGastos[index]?.monto || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
              <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Desglose Diario del Balance</h3>
          {data.desgloseDiario && data.desgloseDiario.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.desgloseDiario.map((item: any) => ({
                fecha: format(new Date(item.fecha), 'dd/MM'),
                balance: item.balance,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                <Legend />
                <Bar dataKey="balance" fill="#3b82f6" name="Balance Diario" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              El desglose diario está disponible solo para rangos de hasta 90 días.
            </p>
          )}
        </div>
      </div>

      {/* Información Adicional */}
      <div className="info-section">
        <div className="info-card">
          <h4>📊 Métricas Clave</h4>
          <ul>
            <li>Porcentaje de Gastos: <strong>{data.porcentajeGastos.toFixed(2)}%</strong></li>
            {data.proyeccionIngresos && (
              <li>Proyección de Ingresos: <strong>{formatearMoneda(data.proyeccionIngresos)}</strong></li>
            )}
          </ul>
        </div>
      </div>

      {/* Auditoría de Ventas Incluidas */}
      {Array.isArray(data.ventasIncluidas) && (
        <div className="info-section">
          <div className="info-card">
            <h4>🧾 Auditoría de Ventas Incluidas</h4>
            <div style={{ marginBottom: 10, color: '#475569' }}>
              Cantidad: <strong>{data.cantidadVentasIncluidas ?? data.ventasIncluidas.length}</strong> ·
              Suma de control: <strong>{formatearMoneda(data.controlSumaVentas ?? 0)}</strong> ·
              Total ingresos: <strong>{formatearMoneda(data.totalIngresos ?? 0)}</strong>
            </div>
            {data.ventasIncluidas.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Medios</th>
                      <th>Subtotal</th>
                      <th>Descuento</th>
                      <th>Recargo</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventasIncluidas.map((v: any) => (
                      <tr key={v.id}>
                        <td>{format(new Date(v.fecha), 'dd/MM/yyyy')}</td>
                        <td>{v.numero}</td>
                        <td>{v.clienteNombre || v.clienteDNI || '-'}</td>
                        <td>
                          {(v.metodosPago || [])
                            .map((mp: any) =>
                              mp.recargo && mp.recargo > 0
                                ? `${mp.tipo} (${mp.recargo}%)`
                                : `${mp.tipo}`,
                            )
                            .join(', ')}
                        </td>
                        <td>{formatearMoneda(v.subtotal || 0)}</td>
                        <td>-{formatearMoneda(v.descuento || 0)}</td>
                        <td>{formatearMoneda(v.recargo || 0)}</td>
                        <td><strong>{formatearMoneda(v.total || 0)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No hay ventas en el período seleccionado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReporteFinanciero;

