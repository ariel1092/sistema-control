import { useState, useEffect } from 'react';
import { cajaApi } from '../services/api';
import { format } from 'date-fns';
import './CajaPage.css';

function CajaPage() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarResumen();
  }, [fecha]);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cajaApi.obtenerResumen(fecha);
      setResumen(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar resumen');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !resumen) {
    return <div className="loading">Cargando resumen...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Resumen de Caja</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {resumen && (
        <>
          <div className="card">
            <h3>Totales del Día</h3>
            <div className="resumen-grid-large">
              <div className="resumen-item">
                <div className="resumen-label">Cantidad de Ventas</div>
                <div className="resumen-value">{resumen.cantidadVentas || 0}</div>
              </div>
              <div className="resumen-item efectivo">
                <div className="resumen-label">Total Efectivo</div>
                <div className="resumen-value">
                  ${resumen.totalEfectivo?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="resumen-item tarjeta">
                <div className="resumen-label">Total Tarjeta</div>
                <div className="resumen-value">
                  ${resumen.totalTarjeta?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="resumen-item transferencia">
                <div className="resumen-label">Total Transferencia</div>
                <div className="resumen-value">
                  ${resumen.totalTransferencia?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="resumen-item total">
                <div className="resumen-label">Total General</div>
                <div className="resumen-value total-amount">
                  ${resumen.totalGeneral?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </div>

          {resumen.estado && (
            <div className="card">
              <div className="estado-caja">
                <strong>Estado de Caja:</strong>
                <span className={`badge badge-${resumen.estado === 'CERRADO' ? 'danger' : 'success'}`}>
                  {resumen.estado}
                </span>
              </div>
              {resumen.observaciones && (
                <div className="mt-10">
                  <strong>Observaciones:</strong> {resumen.observaciones}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!resumen && !loading && (
        <div className="card">
          <div className="alert alert-info">
            No hay datos de caja para esta fecha. Crea algunas ventas para ver el resumen.
          </div>
        </div>
      )}
    </div>
  );
}

export default CajaPage;





