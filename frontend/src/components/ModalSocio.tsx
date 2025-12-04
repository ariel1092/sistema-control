import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ventasApi, retirosApi } from '../services/api';
import './ModalSocio.css';

interface ModalSocioProps {
  socio: 'ABDUL' | 'OSVALDO';
  total: number; // Ganancia del socio (50% del total de ventas)
  transferenciasRecibidas?: number; // Transferencias recibidas en su cuenta (solo para información)
  onClose: () => void;
}

interface Transferencia {
  id: string;
  numero: string;
  fecha: string;
  monto: number;
  referencia?: string;
  createdAt: string;
}

function ModalSocio({ socio, total, transferenciasRecibidas = 0, onClose }: ModalSocioProps) {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [retiros, setRetiros] = useState<any[]>([]);
  const [mostrarFormRetiro, setMostrarFormRetiro] = useState(false);
  const [formRetiro, setFormRetiro] = useState({
    monto: '',
    descripcion: '',
    observaciones: '',
  });
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    cargarTransferencias();
    cargarRetiros();
  }, [socio]);

  const cargarTransferencias = async () => {
    try {
      setLoading(true);
      const fechaHoy = format(new Date(), 'yyyy-MM-dd');
      const response = await ventasApi.obtenerTransferencias(socio, fechaHoy, fechaHoy);
      
      // Extraer transferencias de las ventas
      const transferenciasList: Transferencia[] = [];
      response.data.forEach((venta: any) => {
        venta.metodosPago.forEach((mp: any) => {
          if (mp.tipo === 'TRANSFERENCIA' && mp.cuentaBancaria === socio) {
            transferenciasList.push({
              id: venta.id,
              numero: venta.numero,
              fecha: venta.fecha,
              monto: mp.monto,
              referencia: mp.referencia,
              createdAt: venta.createdAt,
            });
          }
        });
      });
      
      setTransferencias(transferenciasList);
    } catch (err: any) {
      console.error('Error al cargar transferencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarRetiros = async () => {
    try {
      const fechaHoy = format(new Date(), 'yyyy-MM-dd');
      const response = await retirosApi.obtenerTodos(fechaHoy, fechaHoy);
      setRetiros(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar retiros:', err);
    }
  };

  const handleRegistrarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const fechaHoy = format(new Date(), 'yyyy-MM-dd');
      const montoRetiro = parseFloat(formRetiro.monto);
      await retirosApi.crear({
        fecha: fechaHoy,
        cuentaBancaria: socio,
        monto: montoRetiro,
        descripcion: formRetiro.descripcion,
        observaciones: formRetiro.observaciones || undefined,
      });
      
      setSuccess('Retiro registrado exitosamente');
      setMostrarFormRetiro(false);
      setFormRetiro({ monto: '', descripcion: '', observaciones: '' });
      await cargarRetiros();
      
      // Notificar a los reportes que hay un nuevo retiro
      console.log('ModalSocio: Disparando evento retiroRegistrado...');
      const evento = new CustomEvent('retiroRegistrado', { 
        detail: { monto: montoRetiro, cuentaBancaria: socio },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(evento);
      console.log('ModalSocio: Evento retiroRegistrado disparado');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error al registrar retiro:', err);
      alert('Error al registrar retiro: ' + (err.message || 'Error desconocido'));
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-socio" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{socio === 'ABDUL' ? '👤 Abdul' : '👤 Osvaldo'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {success && (
            <div className="alert alert-success" style={{ marginBottom: '16px' }}>
              {success}
            </div>
          )}

          <div className="socio-resumen">
            <div className="resumen-item">
              <span className="resumen-label">Ganancia (50% del total de ventas):</span>
              <span className="resumen-monto">{formatearMonto(total)}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Transferencias recibidas en su cuenta:</span>
              <span className="resumen-monto" style={{ fontSize: '14px', color: '#6b7280' }}>
                {formatearMonto(transferenciasRecibidas)}
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                (solo método de pago, no ganancia individual)
              </span>
            </div>
          </div>

          <div className="seccion-retiro">
            <button
              className="btn-primary btn-retiro"
              onClick={() => setMostrarFormRetiro(!mostrarFormRetiro)}
            >
              {mostrarFormRetiro ? 'Cancelar Retiro' : '💰 Registrar Retiro'}
            </button>

            {mostrarFormRetiro && (
              <form onSubmit={handleRegistrarRetiro} className="form-retiro">
                <div className="form-group">
                  <label>Monto del Retiro *</label>
                  <input
                    type="number"
                    value={formRetiro.monto}
                    onChange={(e) => setFormRetiro({ ...formRetiro, monto: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción *</label>
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
                <button type="submit" className="btn-primary" disabled={loading}>
                  Registrar Retiro
                </button>
              </form>
            )}
          </div>

          <div className="seccion-retiros">
            <h3>Retiros Registrados</h3>
            {retiros.length > 0 ? (
              <div className="retiros-lista">
                {retiros.map((retiro) => (
                  <div key={retiro.id} className="retiro-item">
                    <div className="retiro-info">
                      <span className="retiro-monto">{formatearMonto(retiro.monto)}</span>
                      <span className="retiro-descripcion">{retiro.descripcion}</span>
                      <span className="retiro-fecha">
                        {format(new Date(retiro.fecha), 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                No hay retiros registrados hoy
              </p>
            )}
          </div>

          <div className="seccion-transferencias">
            <h3>Transferencias del Día</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : transferencias.length > 0 ? (
              <div className="transferencias-lista">
                {transferencias.map((transf) => (
                  <div key={transf.id} className="transferencia-item">
                    <div className="transferencia-info">
                      <span className="transferencia-monto">{formatearMonto(transf.monto)}</span>
                      <span className="transferencia-fecha">
                        {format(new Date(transf.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                      {transf.referencia && (
                        <span className="transferencia-ref">Ref: {transf.referencia}</span>
                      )}
                      <span className="transferencia-numero">#{transf.numero}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                No hay transferencias registradas hoy
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalSocio;

