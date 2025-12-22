import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { reportesApi } from '../../services/api';
import { formatearMoneda } from '../../utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Reportes.css';

interface ReporteGastosAvanzadoProps {
  fechaInicio: string;
  fechaFin: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

function ReporteGastosAvanzado({ fechaInicio, fechaFin }: ReporteGastosAvanzadoProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportesApi.gastosAvanzado(fechaInicio, fechaFin);
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el reporte de gastos avanzado');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarDatos();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [cargarDatos]);

  // Usar ref para mantener la función cargarDatos actualizada sin recrear listeners
  const cargarDatosRef = useRef(cargarDatos);
  useEffect(() => {
    cargarDatosRef.current = cargarDatos;
  }, [cargarDatos]);

  // Escuchar eventos de gastos y ventas para actualizar en tiempo real
  useEffect(() => {
    const handleGastoRegistrado = () => {
      console.log('ReporteGastosAvanzado: Evento gastoRegistrado recibido, actualizando...');
      cargarDatosRef.current();
    };

    const handleVentaRegistrada = () => {
      console.log('ReporteGastosAvanzado: Evento ventaRegistrada recibido, actualizando...');
      cargarDatosRef.current();
    };

    window.addEventListener('gastoRegistrado', handleGastoRegistrado);
    window.addEventListener('ventaRegistrada', handleVentaRegistrada);

    return () => {
      window.removeEventListener('gastoRegistrado', handleGastoRegistrado);
      window.removeEventListener('ventaRegistrada', handleVentaRegistrada);
    };
  }, []);

  if (loading) return <div className="loading">Cargando reporte de gastos avanzado...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <div className="reporte-container">
      <h2>💸 Reporte Avanzado de Gastos</h2>

      {/* Cards de Resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <div className="card-label">Total Gastos</div>
            <div className="card-value gastos">{formatearMoneda(data.totalGastos)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Total Ingresos</div>
            <div className="card-value ingresos">{formatearMoneda(data.totalIngresos)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-label">% Gastos sobre Ingresos</div>
            <div className="card-value">{data.porcentajeGastos.toFixed(2)}%</div>
          </div>
        </div>
        {typeof data.proyeccionGastos === 'number' && data.proyeccionGastos > 0 && (
          <div className="summary-card">
            <div className="card-icon">🔮</div>
            <div className="card-content">
              <div className="card-label">Proyección de Gastos</div>
              <div className="card-value">{formatearMoneda(data.proyeccionGastos)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.gastosPorCategoria.map((item: any) => ({
                  name: item.categoria,
                  value: item.total,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.gastosPorCategoria.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Comparativa Mensual (Últimos 3 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.comparativaMensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
              <Legend />
              <Bar dataKey="totalGastos" fill="#ef4444" name="Gastos" />
              <Bar dataKey="totalIngresos" fill="#10b981" name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Tendencia de Gastos (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.tendenciaGastos.map((item: any) => ({
              fecha: format(new Date(item.fecha), 'dd/MM'),
              monto: item.monto,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
              <Legend />
              <Line type="monotone" dataKey="monto" stroke="#ef4444" strokeWidth={2} name="Gastos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="info-section">
        <div className="info-card">
          <h4>📋 Gastos Más Altos</h4>
          {data.gastosMasAltos.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {data.gastosMasAltos.map((gasto: any) => (
                  <tr key={gasto.id}>
                    <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                    <td>{gasto.categoria}</td>
                    <td>{formatearMoneda(gasto.monto)}</td>
                    <td>{gasto.descripcion}</td>
                    <td>{gasto.proveedor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay gastos registrados en este período</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReporteGastosAvanzado;

