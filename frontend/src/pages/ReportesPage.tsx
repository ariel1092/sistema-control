import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import ReporteFinanciero from '../components/reportes/ReporteFinanciero';
import ReporteSocios from '../components/reportes/ReporteSocios';
import ReporteGastosAvanzado from '../components/reportes/ReporteGastosAvanzado';
import './ReportesPage.css';

type TipoReporte = 'financiero' | 'socios' | 'gastos';

function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('financiero');
  const fechaInicioDefault = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), []);
  const fechaFinDefault = useMemo(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'), []);
  const [fechaInicio, setFechaInicio] = useState(fechaInicioDefault);
  const [fechaFin, setFechaFin] = useState(fechaFinDefault);

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <h1 className="page-title">📊 Reportes del Negocio</h1>
        <div className="reportes-controls">
          <div className="date-range-controls">
            <label>Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="date-input"
            />
            <label>Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

      <div className="reportes-tabs">
        <button
          className={`tab-button ${tipoReporte === 'financiero' ? 'active' : ''}`}
          onClick={() => setTipoReporte('financiero')}
        >
          💰 Financiero
        </button>
        <button
          className={`tab-button ${tipoReporte === 'socios' ? 'active' : ''}`}
          onClick={() => setTipoReporte('socios')}
        >
          👥 Socios
        </button>
        <button
          className={`tab-button ${tipoReporte === 'gastos' ? 'active' : ''}`}
          onClick={() => setTipoReporte('gastos')}
        >
          💸 Gastos Avanzado
        </button>
      </div>

      <div className="reportes-content">
        {tipoReporte === 'financiero' && (
          <ReporteFinanciero fechaInicio={fechaInicio} fechaFin={fechaFin} />
        )}
        {tipoReporte === 'socios' && (
          <ReporteSocios fechaInicio={fechaInicio} fechaFin={fechaFin} />
        )}
        {tipoReporte === 'gastos' && (
          <ReporteGastosAvanzado fechaInicio={fechaInicio} fechaFin={fechaFin} />
        )}
      </div>
    </div>
  );
}

export default ReportesPage;

