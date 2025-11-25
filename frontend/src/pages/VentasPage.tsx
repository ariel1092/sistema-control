import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ventasApi } from '../services/api';
import './VentasPage.css';

interface VentaReciente {
  id: string;
  numero: string;
  fecha: string;
  total: number;
  metodosPago: Array<{
    tipo: string;
    monto: number;
    cuentaBancaria?: string;
    recargo?: number;
  }>;
  createdAt: string;
}

function VentasPage() {
  const [efectivo, setEfectivo] = useState('');
  const [transferenciaAbdul, setTransferenciaAbdul] = useState('');
  const [transferenciaOsvaldo, setTransferenciaOsvaldo] = useState('');
  const [creditoDebito, setCreditoDebito] = useState('');
  const [recargoDebito, setRecargoDebito] = useState('');
  const [tipoCreditoDebito, setTipoCreditoDebito] = useState<'CREDITO' | 'DEBITO'>('DEBITO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resúmenes en tiempo real
  const [resumenEfectivo, setResumenEfectivo] = useState(0);
  const [resumenAbdul, setResumenAbdul] = useState(0);
  const [resumenOsvaldo, setResumenOsvaldo] = useState(0);
  const [resumenCreditoDebito, setResumenCreditoDebito] = useState(0);

  // Ventas recientes para deshacer (todas las ventas)
  const [todasVentasEfectivo, setTodasVentasEfectivo] = useState<VentaReciente[]>([]);
  const [todasVentasAbdul, setTodasVentasAbdul] = useState<VentaReciente[]>([]);
  const [todasVentasOsvaldo, setTodasVentasOsvaldo] = useState<VentaReciente[]>([]);
  const [todasVentasCreditoDebito, setTodasVentasCreditoDebito] = useState<VentaReciente[]>([]);

  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [ventasModal, setVentasModal] = useState<VentaReciente[]>([]);
  const [tituloModal, setTituloModal] = useState<string>('');

  // Memoizar la fecha para evitar cambios innecesarios
  const fechaHoy = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Memoizar la función para evitar recrearla en cada render
  const cargarResumenes = useCallback(async () => {
    try {
      // Cargar todas las ventas del día y filtrar por tipo
      const todasLasVentas = await ventasApi.obtenerRecientes(fechaHoy);
      // La respuesta puede venir directamente como array o dentro de .data
      const ventas = Array.isArray(todasLasVentas.data) 
        ? todasLasVentas.data 
        : Array.isArray(todasLasVentas) 
          ? todasLasVentas 
          : [];

      // Calcular totales de efectivo
      const ventasEfectivo = ventas.filter((v: VentaReciente) =>
        v.metodosPago.some((mp) => mp.tipo === 'EFECTIVO')
      );
      const totalEfectivo = ventasEfectivo.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'EFECTIVO')?.monto || 0),
        0
      );
      setResumenEfectivo(totalEfectivo);
      setTodasVentasEfectivo(ventasEfectivo); // Guardar todas las ventas

      // Calcular totales de transferencias Abdul
      const ventasAbdul = ventas.filter((v: VentaReciente) =>
        v.metodosPago.some((mp) => mp.tipo === 'TRANSFERENCIA' && mp.cuentaBancaria === 'ABDUL')
      );
      const totalAbdul = ventasAbdul.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'TRANSFERENCIA' && mp.cuentaBancaria === 'ABDUL')?.monto || 0),
        0
      );
      setResumenAbdul(totalAbdul);
      setTodasVentasAbdul(ventasAbdul); // Guardar todas las ventas

      // Calcular totales de transferencias Osvaldo
      const ventasOsvaldo = ventas.filter((v: VentaReciente) =>
        v.metodosPago.some((mp) => mp.tipo === 'TRANSFERENCIA' && mp.cuentaBancaria === 'OSVALDO')
      );
      const totalOsvaldo = ventasOsvaldo.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'TRANSFERENCIA' && mp.cuentaBancaria === 'OSVALDO')?.monto || 0),
        0
      );
      setResumenOsvaldo(totalOsvaldo);
      setTodasVentasOsvaldo(ventasOsvaldo); // Guardar todas las ventas

      // Calcular totales de crédito/débito
      const ventasCreditoDebito = ventas.filter((v: VentaReciente) =>
        v.metodosPago.some((mp) => mp.tipo === 'CREDITO' || mp.tipo === 'DEBITO')
      );
      const totalCreditoDebito = ventasCreditoDebito.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'CREDITO' || mp.tipo === 'DEBITO')?.monto || 0),
        0
      );
      setResumenCreditoDebito(totalCreditoDebito);
      setTodasVentasCreditoDebito(ventasCreditoDebito); // Guardar todas las ventas
    } catch (err: any) {
      console.error('Error al cargar resúmenes:', err);
    }
  }, [fechaHoy]);

  // Cargar resúmenes solo al montar el componente
  useEffect(() => {
    cargarResumenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const guardarVenta = async (tipo: string, monto: number, cuentaBancaria?: string, recargo?: number) => {
    if (monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcular monto con recargo si aplica
      let montoFinal = monto;
      if (recargo && recargo > 0) {
        montoFinal = monto * (1 + recargo / 100);
      }

      // Crear venta simple sin productos
      const metodoPagoData: any = {
        tipo: tipo,
        monto: montoFinal,
        recargo: recargo || 0,
      };

      // Agregar cuenta bancaria solo si es transferencia
      if (tipo === 'TRANSFERENCIA' && cuentaBancaria) {
        metodoPagoData.cuentaBancaria = cuentaBancaria;
        metodoPagoData.referencia = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      const ventaData = {
        items: [], // Sin productos, solo registro de pago
        metodosPago: [metodoPagoData],
        tipoComprobante: 'REMITO',
        observaciones: `Venta registrada - ${tipo}${cuentaBancaria ? ` (${cuentaBancaria})` : ''}${recargo && recargo > 0 ? ` - Recargo: ${recargo}%` : ''}`,
      };

      await ventasApi.crear(ventaData);
      setSuccess(`Venta de $${montoFinal.toFixed(2)} registrada exitosamente`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Recargar resúmenes después de guardar
      await cargarResumenes();
      
      // Notificar al Dashboard que hay una nueva venta (usando evento personalizado)
      console.log('VentasPage: Disparando evento ventaRegistrada...');
      const evento = new CustomEvent('ventaRegistrada', { 
        detail: { monto: montoFinal, tipo: tipo },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(evento);
      console.log('VentasPage: Evento ventaRegistrada disparado');
      
      // También intentar actualizar directamente si el Dashboard está en la misma ventana
      // Esto es un fallback en caso de que los eventos no funcionen
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ventaRegistrada', { 
          detail: { monto: montoFinal, tipo: tipo },
          bubbles: true
        }));
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  const deshacerVenta = async (ventaId: string) => {
    if (!confirm('¿Está seguro de que desea cancelar esta venta?')) {
      return;
    }

    try {
      setLoading(true);
      await ventasApi.cancelar(ventaId, 'Cancelada por error del usuario');
      setSuccess('Venta cancelada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recargar resúmenes después de cancelar
      await cargarResumenes();
      
      // Notificar al Dashboard que se canceló una venta
      console.log('Disparando evento ventaCancelada...');
      window.dispatchEvent(new CustomEvent('ventaCancelada', { 
        detail: { ventaId } 
      }));
    } catch (err: any) {
      setError(err.message || 'Error al cancelar venta');
    } finally {
      setLoading(false);
    }
  };

  const handleEfectivo = async () => {
    const monto = parseFloat(efectivo);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    await guardarVenta('EFECTIVO', monto);
    setEfectivo('');
  };

  const handleTransferenciaAbdul = async () => {
    const monto = parseFloat(transferenciaAbdul);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    await guardarVenta('TRANSFERENCIA', monto, 'ABDUL');
    setTransferenciaAbdul('');
  };

  const handleTransferenciaOsvaldo = async () => {
    const monto = parseFloat(transferenciaOsvaldo);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    await guardarVenta('TRANSFERENCIA', monto, 'OSVALDO');
    setTransferenciaOsvaldo('');
  };

  const handleCreditoDebito = async () => {
    const monto = parseFloat(creditoDebito);
    if (isNaN(monto) || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    const recargo = tipoCreditoDebito === 'DEBITO' && recargoDebito ? parseFloat(recargoDebito) : 0;
    await guardarVenta(tipoCreditoDebito, monto, undefined, recargo);
    setCreditoDebito('');
    setRecargoDebito('');
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const abrirModal = (tipo: string, todasLasVentas: VentaReciente[], titulo: string) => {
    console.log('Abriendo modal:', tipo, 'con', todasLasVentas.length, 'ventas');
    setVentasModal(todasLasVentas);
    setModalAbierto(tipo);
    setTituloModal(titulo);
  };

  const cerrarModal = () => {
    console.log('Cerrando modal');
    setModalAbierto(null);
    setVentasModal([]);
    setTituloModal('');
  };

  return (
    <div className="ventas-simple-page">
      <div className="ventas-header">
        <h1 className="page-title">💰 Registro de Ventas</h1>
        <p className="page-subtitle">Registre las ventas por método de pago</p>
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

      <div className="ventas-sections">
        {/* Sección Efectivo */}
        <div className="venta-section efectivo-section">
          <div className="section-header">
            <div className="section-icon">💵</div>
            <h2>Efectivo</h2>
          </div>
          <div className="section-content">
            <div className="input-group">
              <label>Monto</label>
              <div className="input-with-button">
                <input
                  type="number"
                  value={efectivo}
                  onChange={(e) => setEfectivo(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEfectivo();
                    }
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={handleEfectivo}
                  disabled={loading || !efectivo || parseFloat(efectivo) <= 0}
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Resumen en tiempo real */}
            <div className="resumen-section">
              <div className="resumen-total">
                <span className="resumen-label">Total del día:</span>
                <span className="resumen-monto">{formatearMonto(resumenEfectivo)}</span>
              </div>

              {/* Lista de ventas recientes */}
              {todasVentasEfectivo.length > 0 ? (
                <div className="ventas-recientes">
                  <h4>Ventas recientes ({todasVentasEfectivo.length}):</h4>
                  <div className="ventas-lista">
                    {todasVentasEfectivo.slice(0, 10).map((venta) => (
                      <div key={venta.id} className="venta-item">
                        <div className="venta-info">
                          <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                          <span className="venta-hora">
                            {format(new Date(venta.createdAt), 'HH:mm:ss')}
                          </span>
                        </div>
                        <button
                          className="btn-undo"
                          onClick={() => deshacerVenta(venta.id)}
                          title="Deshacer venta"
                        >
                          ↶
                        </button>
                      </div>
                    ))}
                  </div>
                  {todasVentasEfectivo.length > 10 && (
                    <button
                      className="btn-ver-mas"
                      onClick={() => abrirModal('efectivo', todasVentasEfectivo, 'Todas las Ventas en Efectivo')}
                    >
                      Ver más ({todasVentasEfectivo.length - 10} más)
                    </button>
                  )}
                </div>
              ) : (
                <div className="ventas-recientes">
                  <p style={{ color: '#9ca3af', fontSize: '14px', margin: '12px 0 0 0' }}>
                    No hay ventas registradas hoy
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección Transferencias */}
        <div className="venta-section transferencias-section">
          <div className="section-header">
            <div className="section-icon">🏦</div>
            <h2>Transferencias</h2>
          </div>
          <div className="section-content">
            <div className="transferencias-grid">
              {/* Abdul */}
              <div className="transferencia-item">
                <div className="transferencia-label">
                  <span className="transferencia-icon">👤</span>
                  <span>Abdul</span>
                </div>
                <div className="input-with-button">
                  <input
                    type="number"
                    value={transferenciaAbdul}
                    onChange={(e) => setTransferenciaAbdul(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTransferenciaAbdul();
                      }
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleTransferenciaAbdul}
                    disabled={loading || !transferenciaAbdul || parseFloat(transferenciaAbdul) <= 0}
                  >
                    Guardar
                  </button>
                </div>

                {/* Resumen Abdul */}
                <div className="resumen-section">
                  <div className="resumen-total">
                    <span className="resumen-label">Total:</span>
                    <span className="resumen-monto">{formatearMonto(resumenAbdul)}</span>
                  </div>
                  {todasVentasAbdul.length > 0 && (
                    <div className="ventas-recientes">
                      <div className="ventas-lista">
                        {todasVentasAbdul.slice(0, 10).map((venta) => (
                          <div key={venta.id} className="venta-item">
                            <div className="venta-info">
                              <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                              <span className="venta-hora">
                                {format(new Date(venta.createdAt), 'HH:mm:ss')}
                              </span>
                            </div>
                            <button
                              className="btn-undo"
                              onClick={() => deshacerVenta(venta.id)}
                              title="Deshacer venta"
                            >
                              ↶
                            </button>
                          </div>
                        ))}
                      </div>
                      {todasVentasAbdul.length > 10 && (
                        <button
                          className="btn-ver-mas"
                          onClick={() => abrirModal('abdul', todasVentasAbdul, 'Todas las Transferencias - Abdul')}
                        >
                          Ver más ({todasVentasAbdul.length - 10} más)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Osvaldo */}
              <div className="transferencia-item">
                <div className="transferencia-label">
                  <span className="transferencia-icon">👤</span>
                  <span>Osvaldo</span>
                </div>
                <div className="input-with-button">
                  <input
                    type="number"
                    value={transferenciaOsvaldo}
                    onChange={(e) => setTransferenciaOsvaldo(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTransferenciaOsvaldo();
                      }
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleTransferenciaOsvaldo}
                    disabled={loading || !transferenciaOsvaldo || parseFloat(transferenciaOsvaldo) <= 0}
                  >
                    Guardar
                  </button>
                </div>

                {/* Resumen Osvaldo */}
                <div className="resumen-section">
                  <div className="resumen-total">
                    <span className="resumen-label">Total:</span>
                    <span className="resumen-monto">{formatearMonto(resumenOsvaldo)}</span>
                  </div>
                  {todasVentasOsvaldo.length > 0 && (
                    <div className="ventas-recientes">
                      <div className="ventas-lista">
                        {todasVentasOsvaldo.slice(0, 10).map((venta) => (
                          <div key={venta.id} className="venta-item">
                            <div className="venta-info">
                              <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                              <span className="venta-hora">
                                {format(new Date(venta.createdAt), 'HH:mm:ss')}
                              </span>
                            </div>
                            <button
                              className="btn-undo"
                              onClick={() => deshacerVenta(venta.id)}
                              title="Deshacer venta"
                            >
                              ↶
                            </button>
                          </div>
                        ))}
                      </div>
                      {todasVentasOsvaldo.length > 10 && (
                        <button
                          className="btn-ver-mas"
                          onClick={() => abrirModal('osvaldo', todasVentasOsvaldo, 'Todas las Transferencias - Osvaldo')}
                        >
                          Ver más ({todasVentasOsvaldo.length - 10} más)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Crédito/Débito */}
        <div className="venta-section credito-section">
          <div className="section-header">
            <div className="section-icon">💳</div>
            <h2>Crédito / Débito</h2>
          </div>
          <div className="section-content">
            <div className="input-group">
              <label>Tipo</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="DEBITO"
                    checked={tipoCreditoDebito === 'DEBITO'}
                    onChange={(e) => setTipoCreditoDebito(e.target.value as 'DEBITO' | 'CREDITO')}
                  />
                  Débito
                </label>
                <label>
                  <input
                    type="radio"
                    value="CREDITO"
                    checked={tipoCreditoDebito === 'CREDITO'}
                    onChange={(e) => setTipoCreditoDebito(e.target.value as 'DEBITO' | 'CREDITO')}
                  />
                  Crédito
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Monto</label>
              <input
                type="number"
                value={creditoDebito}
                onChange={(e) => setCreditoDebito(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreditoDebito();
                  }
                }}
              />
            </div>

            {tipoCreditoDebito === 'DEBITO' && (
              <div className="input-group">
                <label>Recargo (%) - Opcional</label>
                <input
                  type="number"
                  value={recargoDebito}
                  onChange={(e) => setRecargoDebito(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            )}

            <button
              className="btn-primary btn-full"
              onClick={handleCreditoDebito}
              disabled={loading || !creditoDebito || parseFloat(creditoDebito) <= 0}
            >
              Guardar
            </button>

            {/* Resumen Crédito/Débito */}
            <div className="resumen-section">
              <div className="resumen-total">
                <span className="resumen-label">Total del día:</span>
                <span className="resumen-monto">{formatearMonto(resumenCreditoDebito)}</span>
              </div>

              {todasVentasCreditoDebito.length > 0 && (
                <div className="ventas-recientes">
                  <h4>Ventas recientes ({todasVentasCreditoDebito.length}):</h4>
                  <div className="ventas-lista">
                    {todasVentasCreditoDebito.slice(0, 10).map((venta) => (
                      <div key={venta.id} className="venta-item">
                        <div className="venta-info">
                          <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                          <span className="venta-tipo">{venta.metodosPago[0]?.tipo}</span>
                          <span className="venta-hora">
                            {format(new Date(venta.createdAt), 'HH:mm:ss')}
                          </span>
                        </div>
                        <button
                          className="btn-undo"
                          onClick={() => deshacerVenta(venta.id)}
                          title="Deshacer venta"
                        >
                          ↶
                        </button>
                      </div>
                    ))}
                  </div>
                  {todasVentasCreditoDebito.length > 10 && (
                    <button
                      className="btn-ver-mas"
                      onClick={() => abrirModal('credito-debito', todasVentasCreditoDebito, 'Todas las Ventas en Crédito/Débito')}
                    >
                      Ver más ({todasVentasCreditoDebito.length - 10} más)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para ver todas las ventas */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tituloModal}</h2>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="ventas-lista-modal">
                {ventasModal.map((venta) => (
                  <div key={venta.id} className="venta-item-modal">
                    <div className="venta-info-modal">
                      <span className="venta-monto-modal">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                      {venta.metodosPago[0]?.tipo && (
                        <span className="venta-tipo-modal">{venta.metodosPago[0]?.tipo}</span>
                      )}
                      <span className="venta-fecha-modal">
                        {format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                      <span className="venta-numero-modal">#{venta.numero}</span>
                    </div>
                    <button
                      className="btn-undo-modal"
                      onClick={() => {
                        deshacerVenta(venta.id);
                        cerrarModal();
                      }}
                      title="Deshacer venta"
                    >
                      ↶
                    </button>
                  </div>
                ))}
              </div>
              {ventasModal.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                  No hay ventas para mostrar
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={cerrarModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VentasPage;
