import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { reportesApi } from '../../services/api';
import { formatearMoneda } from '../../utils/formatters';
import {
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

interface ReporteSociosProps {
  fechaInicio: string;
  fechaFin: string;
}

const COLORS = ['#3b82f6', '#10b981'];

function ReporteSocios({ fechaInicio, fechaFin }: ReporteSociosProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportesApi.socios(fechaInicio, fechaFin);
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el reporte de socios');
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

  // Escuchar eventos de ventas y retiros para actualizar en tiempo real
  useEffect(() => {
    const handleVentaRegistrada = () => {
      console.log('ReporteSocios: Evento ventaRegistrada recibido, actualizando...');
      cargarDatosRef.current();
    };
    
    const handleVentaCancelada = () => {
      console.log('ReporteSocios: Evento ventaCancelada recibido, actualizando...');
      cargarDatosRef.current();
    };

    const handleRetiroRegistrado = () => {
      console.log('ReporteSocios: Evento retiroRegistrado recibido, actualizando...');
      cargarDatosRef.current();
    };

    const handleGastoRegistrado = () => {
      console.log('ReporteSocios: Evento gastoRegistrado recibido, actualizando...');
      cargarDatosRef.current();
    };

    window.addEventListener('ventaRegistrada', handleVentaRegistrada);
    window.addEventListener('ventaCancelada', handleVentaCancelada);
    window.addEventListener('retiroRegistrado', handleRetiroRegistrado);
    window.addEventListener('gastoRegistrado', handleGastoRegistrado);

    return () => {
      window.removeEventListener('ventaRegistrada', handleVentaRegistrada);
      window.removeEventListener('ventaCancelada', handleVentaCancelada);
      window.removeEventListener('retiroRegistrado', handleRetiroRegistrado);
      window.removeEventListener('gastoRegistrado', handleGastoRegistrado);
    };
  }, []);

  if (loading) return <div className="loading">Cargando reporte de socios...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  return (
    <div className="reporte-container">
      <h2>👥 Reporte de Balance de Socios</h2>

      {/* Cards de Resumen */}
      <div className="summary-cards">
        {data.balances.map((balance: any) => (
          <div key={balance.cuentaBancaria} className="summary-card">
            <div className="card-icon">{balance.cuentaBancaria === 'ABDUL' ? '👤' : '👤'}</div>
            <div className="card-content">
              <div className="card-label">{balance.cuentaBancaria === 'ABDUL' ? 'Cuenta A' : 'Cuenta O'}</div>
              <div className="card-value">{formatearMoneda(balance.totalRetiros)}</div>
              <div className="card-subvalue">
                Retiros: {formatearMoneda(balance.totalRetiros)}
              </div>
              <div className="card-subvalue" style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                Transferencias recibidas: {formatearMoneda(balance.totalTransferenciasRecibidas || 0)}
              </div>
              <div className="card-subvalue" style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                Gastos MercadoPago: {formatearMoneda(balance.totalGastosMercadoPago || 0)}
              </div>
            </div>
          </div>
        ))}
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Total Retiros Combinados</div>
            <div className="card-value">{formatearMoneda(data.totalRetirosCombinados)}</div>
            <div className="card-subvalue" style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
              Total Transferencias: {formatearMoneda(data.totalTransferenciasCombinadas || 0)}
            </div>
            <div className="card-subvalue" style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
              Total Gastos MercadoPago: {formatearMoneda(data.totalGastosMercadoPagoCombinados || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Comparativa de Retiros y Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.comparativa.map((item: any) => ({
              socio: item.socio === 'ABDUL' ? 'Cuenta A' : 'Cuenta O',
              retiros: item.retiros,
              gastosMercadoPago: item.gastosMercadoPago || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="socio" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
              <Legend />
              <Bar dataKey="retiros" fill="#ef4444" name="Retiros" />
              <Bar dataKey="gastosMercadoPago" fill="#f59e0b" name="Gastos MercadoPago" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Distribución de Transferencias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.comparativa.map((item: any) => ({
                  name: item.socio === 'ABDUL' ? 'Cuenta A' : 'Cuenta O',
                  value: item.transferencias || 0,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.comparativa.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatearMoneda(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historial de Retiros */}
      <div className="info-section">
        <div className="info-card">
          <h4>📋 Historial de Retiros</h4>
          {data.historialRetiros.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Socio</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {data.historialRetiros.map((retiro: any) => (
                  <tr key={retiro.id}>
                    <td>{format(new Date(retiro.fecha), 'dd/MM/yyyy HH:mm')}</td>
                    <td>{retiro.cuentaBancaria}</td>
                    <td>{formatearMoneda(retiro.monto)}</td>
                    <td>{retiro.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay retiros registrados en este período</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReporteSocios;

