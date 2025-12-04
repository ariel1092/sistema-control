import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, startOfYear } from 'date-fns';
import { cajaApi } from '../services/api';
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
import './DashboardPage.css';

type Periodo = 'diario' | 'semanal' | 'anual';

function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('diario');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resumenDiario, setResumenDiario] = useState<any>(null);
  const [resumenSemanal, setResumenSemanal] = useState<any[]>([]);
  const [resumenAnual, setResumenAnual] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      switch (periodo) {
        case 'diario': {
          const response = await cajaApi.obtenerResumen(fecha);
          console.log('Dashboard: Datos recibidos del resumen:', response.data);
          console.log('Dashboard: Total General:', response.data?.totalGeneral);
          console.log('Dashboard: Total Efectivo:', response.data?.totalEfectivo);
          console.log('Dashboard: Cantidad Ventas:', response.data?.cantidadVentas);
          // Forzar actualización del estado
          setResumenDiario({ ...response.data });
          break;
        }
        case 'semanal': {
          const fechaActual = new Date(fecha);
          const inicioSemana = startOfWeek(fechaActual, { weekStartsOn: 1 });
          const datos: any[] = [];
          for (let i = 0; i < 7; i++) {
            const fechaDia = new Date(inicioSemana);
            fechaDia.setDate(inicioSemana.getDate() + i);
            const fechaStr = format(fechaDia, 'yyyy-MM-dd');
            try {
              const response = await cajaApi.obtenerResumen(fechaStr);
              datos.push({
                fecha: format(fechaDia, 'dd/MM'),
                dia: format(fechaDia, 'EEE'),
                ...response.data,
              });
            } catch (err) {
              datos.push({
                fecha: format(fechaDia, 'dd/MM'),
                dia: format(fechaDia, 'EEE'),
                totalGeneral: 0,
                cantidadVentas: 0,
                totalEfectivo: 0,
                totalTarjeta: 0,
              });
            }
          }
          setResumenSemanal(datos);
          break;
        }
        case 'anual': {
          const fechaActual = new Date(fecha);
          const inicioAño = startOfYear(fechaActual);
          const datos: any[] = [];
          for (let i = 0; i < 12; i++) {
            const fechaMes = new Date(inicioAño);
            fechaMes.setMonth(inicioAño.getMonth() + i);
            const fechaMedioMes = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 15);
            const fechaStr = format(fechaMedioMes, 'yyyy-MM-dd');
            try {
              const response = await cajaApi.obtenerResumen(fechaStr);
              datos.push({
                mes: format(fechaMes, 'MMM'),
                mesNumero: fechaMes.getMonth() + 1,
                ...response.data,
              });
            } catch (err) {
              datos.push({
                mes: format(fechaMes, 'MMM'),
                mesNumero: fechaMes.getMonth() + 1,
                totalGeneral: 0,
                cantidadVentas: 0,
                totalEfectivo: 0,
                totalTarjeta: 0,
              });
            }
          }
          setResumenAnual(datos);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [periodo, fecha]);

  // Cargar datos al montar y cuando cambian periodo/fecha
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Usar ref para mantener la función cargarDatos actualizada sin recrear listeners
  const cargarDatosRef = useRef(cargarDatos);
  useEffect(() => {
    cargarDatosRef.current = cargarDatos;
  }, [cargarDatos]);

  // Escuchar eventos de ventas para actualizar en tiempo real
  useEffect(() => {
    console.log('Dashboard: Configurando listeners de eventos...');
    
    const handleVentaRegistrada = (event: Event) => {
      console.log('Dashboard: Evento ventaRegistrada recibido!', event);
      // Usar la referencia actualizada
      console.log('Dashboard: Actualizando datos inmediatamente...');
      cargarDatosRef.current();
    };
    
    const handleVentaCancelada = (event: Event) => {
      console.log('Dashboard: Evento ventaCancelada recibido!', event);
      // Usar la referencia actualizada
      console.log('Dashboard: Actualizando datos inmediatamente...');
      cargarDatosRef.current();
    };

    window.addEventListener('ventaRegistrada', handleVentaRegistrada);
    window.addEventListener('ventaCancelada', handleVentaCancelada);
    
    console.log('Dashboard: Listeners configurados correctamente');

    return () => {
      console.log('Dashboard: Limpiando listeners...');
      window.removeEventListener('ventaRegistrada', handleVentaRegistrada);
      window.removeEventListener('ventaCancelada', handleVentaCancelada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo montar una vez, usar ref para la función actualizada


  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="page-title">📊 Dashboard de Reportes</h1>
          <div className="header-controls">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="period-select"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="anual">Anual</option>
            </select>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">Cargando datos...</div>
        </div>
      )}

      {/* Reporte Diario */}
      {periodo === 'diario' && resumenDiario && (
        <div className="dashboard-content">
          {/* Cards de Resumen */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-label">Total General</div>
                <div className="card-value">${(resumenDiario.totalGeneral || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-label">Cantidad de Ventas</div>
                <div className="card-value">{resumenDiario.cantidadVentas || 0}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">💵</div>
              <div className="card-content">
                <div className="card-label">Efectivo</div>
                <div className="card-value">${(resumenDiario.totalEfectivo || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">💳</div>
              <div className="card-content">
                <div className="card-label">Tarjeta/Transferencia</div>
                <div className="card-value">${((resumenDiario.totalTarjeta || 0) + (resumenDiario.totalTransferencia || 0)).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Distribución de Pagos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Efectivo', value: resumenDiario.totalEfectivo || 0 },
                      { name: 'Tarjeta', value: resumenDiario.totalTarjeta || 0 },
                      { name: 'Transferencia', value: resumenDiario.totalTransferencia || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Efectivo', value: resumenDiario.totalEfectivo || 0 },
                      { name: 'Tarjeta', value: resumenDiario.totalTarjeta || 0 },
                      { name: 'Transferencia', value: resumenDiario.totalTransferencia || 0 },
                    ].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Resumen del Día</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Efectivo',
                      valor: resumenDiario.totalEfectivo || 0,
                    },
                    {
                      name: 'Tarjeta',
                      valor: resumenDiario.totalTarjeta || 0,
                    },
                    {
                      name: 'Transferencia',
                      valor: resumenDiario.totalTransferencia || 0,
                    },
                    {
                      name: 'Total',
                      valor: resumenDiario.totalGeneral || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="valor" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reporte Semanal */}
      {periodo === 'semanal' && resumenSemanal.length > 0 && (
        <div className="dashboard-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-label">Total Semanal</div>
                <div className="card-value">
                  ${resumenSemanal.reduce((sum, d) => sum + (d.totalGeneral || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-label">Total Ventas</div>
                <div className="card-value">
                  {resumenSemanal.reduce((sum, d) => sum + (d.cantidadVentas || 0), 0)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <div className="card-label">Promedio Diario</div>
                <div className="card-value">
                  ${(resumenSemanal.reduce((sum, d) => sum + (d.totalGeneral || 0), 0) / 7).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card full-width">
              <h3 className="chart-title">Ventas por Día de la Semana</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={resumenSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="totalGeneral" stroke="#3b82f6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="totalEfectivo" stroke="#10b981" strokeWidth={2} name="Efectivo" />
                  <Line type="monotone" dataKey="totalTarjeta" stroke="#f59e0b" strokeWidth={2} name="Tarjeta" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card full-width">
              <h3 className="chart-title">Comparativa Semanal</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={resumenSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="totalEfectivo" fill="#10b981" name="Efectivo" />
                  <Bar dataKey="totalTarjeta" fill="#f59e0b" name="Tarjeta" />
                  <Bar dataKey="totalGeneral" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reporte Anual */}
      {periodo === 'anual' && resumenAnual.length > 0 && (
        <div className="dashboard-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-label">Total Anual</div>
                <div className="card-value">
                  ${resumenAnual.reduce((sum, d) => sum + (d.totalGeneral || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <div className="card-label">Total Ventas</div>
                <div className="card-value">
                  {resumenAnual.reduce((sum, d) => sum + (d.cantidadVentas || 0), 0)}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <div className="card-label">Promedio Mensual</div>
                <div className="card-value">
                  ${(resumenAnual.reduce((sum, d) => sum + (d.totalGeneral || 0), 0) / 12).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card full-width">
              <h3 className="chart-title">Ventas por Mes</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={resumenAnual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="totalGeneral" stroke="#3b82f6" strokeWidth={3} name="Total Mensual" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card full-width">
              <h3 className="chart-title">Comparativa Anual</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={resumenAnual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="totalEfectivo" fill="#10b981" name="Efectivo" />
                  <Bar dataKey="totalTarjeta" fill="#f59e0b" name="Tarjeta" />
                  <Bar dataKey="totalGeneral" fill="#3b82f6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;

