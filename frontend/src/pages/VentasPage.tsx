import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns'; // date-fns v3 ya hace tree-shaking automático
import { ventasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const [efectivo, setEfectivo] = useState('');
  const [transferenciaAbdul, setTransferenciaAbdul] = useState(''); // Reutilizamos este estado para transferencias
  const [creditoDebito, setCreditoDebito] = useState('');
  const [recargoDebito, setRecargoDebito] = useState('');
  const [tipoCreditoDebito, setTipoCreditoDebito] = useState<'CREDITO' | 'DEBITO'>('DEBITO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resúmenes en tiempo real
  const [resumenEfectivo, setResumenEfectivo] = useState(0);
  const [resumenTransferencias, setResumenTransferencias] = useState(0);
  const [resumenCreditoDebito, setResumenCreditoDebito] = useState(0);
  
  // Calcular total del día
  const totalVentasDia = useMemo(() => {
    return resumenEfectivo + resumenTransferencias + resumenCreditoDebito;
  }, [resumenEfectivo, resumenTransferencias, resumenCreditoDebito]);

  // Ventas recientes para deshacer (todas las ventas)
  const [todasVentasEfectivo, setTodasVentasEfectivo] = useState<VentaReciente[]>([]);
  const [todasVentasTransferencias, setTodasVentasTransferencias] = useState<VentaReciente[]>([]);
  const [todasVentasCreditoDebito, setTodasVentasCreditoDebito] = useState<VentaReciente[]>([]);
  
  // Estado para seleccionar cuenta bancaria en transferencias
  const [cuentaBancariaSeleccionada, setCuentaBancariaSeleccionada] = useState<'ABDUL' | 'OSVALDO'>('ABDUL');

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
      const ventasEfectivo = ventas
        .filter((v: VentaReciente) =>
          v.metodosPago.some((mp) => mp.tipo === 'EFECTIVO')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha más reciente primero
      const totalEfectivo = ventasEfectivo.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'EFECTIVO')?.monto || 0),
        0
      );
      setResumenEfectivo(totalEfectivo);
      setTodasVentasEfectivo(ventasEfectivo); // Guardar todas las ventas

      // Calcular totales de transferencias (todas juntas)
      const ventasTransferencias = ventas
        .filter((v: VentaReciente) =>
          v.metodosPago.some((mp) => mp.tipo === 'TRANSFERENCIA')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha más reciente primero
      const totalTransferencias = ventasTransferencias.reduce(
        (sum: number, v: VentaReciente) =>
          sum + (v.metodosPago.find((mp) => mp.tipo === 'TRANSFERENCIA')?.monto || 0),
        0
      );
      setResumenTransferencias(totalTransferencias);
      setTodasVentasTransferencias(ventasTransferencias); // Guardar todas las ventas

      // Calcular totales de crédito/débito
      const ventasCreditoDebito = ventas
        .filter((v: VentaReciente) =>
          v.metodosPago.some((mp) => mp.tipo === 'CREDITO' || mp.tipo === 'DEBITO')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha más reciente primero
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

      if (!user || !user.id) {
        setError('Debe estar autenticado para registrar una venta');
        setLoading(false);
        return;
      }

      const ventaData = {
        vendedorId: user.id, // ID del usuario autenticado como vendedor
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
      window.dispatchEvent(new CustomEvent('ventaRegistrada', { 
        detail: { monto: montoFinal, tipo: tipo },
        bubbles: true,
      }));
      
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

  const handleTransferencia = async () => {
    const monto = parseFloat(transferenciaAbdul); // Reutilizamos el estado existente
    if (isNaN(monto) || monto <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    await guardarVenta('TRANSFERENCIA', monto, cuentaBancariaSeleccionada);
    setTransferenciaAbdul('');
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
    setVentasModal(todasLasVentas);
    setModalAbierto(tipo);
    setTituloModal(titulo);
  };

  const cerrarModal = () => {
    setModalAbierto(null);
    setVentasModal([]);
    setTituloModal('');
  };

  return (
    <div className="ventas-simple-page">
      <div className="ventas-header">
        <h1 className="page-title">💰 Registro de Ventas</h1>
        <p className="page-subtitle">Registre las ventas por método de pago</p>
        <div className="total-dia-container">
          <div className="total-dia">
            <span className="total-dia-label">Total del día:</span>
            <span className="total-dia-monto">{formatearMonto(totalVentasDia || 0)}</span>
          </div>
        </div>
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
                  placeholder="0"
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
                  <div className="ventas-lista">
                    {todasVentasEfectivo.slice(0, 5).map((venta) => (
                        <div key={venta.id} className="venta-item">
                          <div className="venta-info">
                            <span className="venta-monto">{formatearMonto(venta.metodosPago?.[0]?.monto || 0)}</span>
                            <span className="venta-fecha-hora">
                              {venta.createdAt ? format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}
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
                      );
                    })}
                  </div>
                  {todasVentasEfectivo.length > 5 && (
                    <button
                      className="btn-ver-mas"
                      onClick={() => abrirModal('efectivo', todasVentasEfectivo, 'Todas las Ventas en Efectivo')}
                    >
                      Ver más ({todasVentasEfectivo.length - 5} más)
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
            <div className="input-group">
              <label>Cuenta Bancaria</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="ABDUL"
                    checked={cuentaBancariaSeleccionada === 'ABDUL'}
                    onChange={(e) => setCuentaBancariaSeleccionada(e.target.value as 'ABDUL' | 'OSVALDO')}
                  />
                  Abdul
                </label>
                <label>
                  <input
                    type="radio"
                    value="OSVALDO"
                    checked={cuentaBancariaSeleccionada === 'OSVALDO'}
                    onChange={(e) => setCuentaBancariaSeleccionada(e.target.value as 'ABDUL' | 'OSVALDO')}
                  />
                  Osvaldo
                </label>
              </div>
            </div>
            
            <div className="input-group">
              <label>Monto</label>
              <div className="input-with-button">
                <input
                  type="number"
                  value={transferenciaAbdul}
                  onChange={(e) => setTransferenciaAbdul(e.target.value)}
                  placeholder="0"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTransferencia();
                    }
                  }}
                />
                <button
                  className="btn-primary"
                  onClick={handleTransferencia}
                  disabled={loading || !transferenciaAbdul || parseFloat(transferenciaAbdul) <= 0}
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Resumen Transferencias */}
            <div className="resumen-section">
              <div className="resumen-total">
                <span className="resumen-label">Total del día:</span>
                <span className="resumen-monto">{formatearMonto(resumenTransferencias)}</span>
              </div>

              {todasVentasTransferencias.length > 0 && (
                <div className="ventas-recientes">
                  <div className="ventas-lista">
                    {todasVentasTransferencias.slice(0, 5).map((venta) => (
                      <div key={venta.id} className="venta-item">
                        <div className="venta-info">
                          <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                          <span className="venta-tipo">{venta.metodosPago[0]?.cuentaBancaria || 'TRANSFERENCIA'}</span>
                          <span className="venta-fecha-hora">
                            {format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm')}
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
                  {todasVentasTransferencias.length > 5 && (
                    <button
                      className="btn-ver-mas"
                      onClick={() => abrirModal('transferencias', todasVentasTransferencias, 'Todas las Transferencias')}
                    >
                      Ver más ({todasVentasTransferencias.length - 5} más)
                    </button>
                  )}
                </div>
              )}
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
                placeholder="0"
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
                  <div className="ventas-lista">
                    {todasVentasCreditoDebito.slice(0, 5).map((venta) => (
                      <div key={venta.id} className="venta-item">
                        <div className="venta-info">
                          <span className="venta-monto">{formatearMonto(venta.metodosPago[0]?.monto || 0)}</span>
                          <span className="venta-tipo">{venta.metodosPago[0]?.tipo}</span>
                          <span className="venta-fecha-hora">
                            {format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm')}
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
                  {todasVentasCreditoDebito.length > 5 && (
                    <button
                      className="btn-ver-mas"
                      onClick={() => abrirModal('credito-debito', todasVentasCreditoDebito, 'Todas las Ventas en Crédito/Débito')}
                    >
                      Ver más ({todasVentasCreditoDebito.length - 5} más)
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
