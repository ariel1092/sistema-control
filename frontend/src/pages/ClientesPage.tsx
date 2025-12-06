import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { clientesApi } from '../services/api';
import './ClientesPage.css';

// Fix: Removed unused handleAbrirModalFactura function

interface Cliente {
  id: string;
  nombre: string;
  razonSocial?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  observaciones?: string;
  tieneCuentaCorriente: boolean;
  saldoCuentaCorriente: number;
  createdAt: Date;
  updatedAt: Date;
}

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalCuentaCorriente, setShowModalCuentaCorriente] = useState(false);
  const [showModalFactura, setShowModalFactura] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [showModalPagoDirecto, setShowModalPagoDirecto] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [cuentaCorriente, setCuentaCorriente] = useState<any>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [formDataFactura, setFormDataFactura] = useState({
    numero: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    fechaVencimiento: '',
    montoTotal: '',
    descripcion: '',
    observaciones: '',
  });
  const [formDataPago, setFormDataPago] = useState({
    monto: '',
    descripcion: '',
    observaciones: '',
    pagarTotal: true,
  });
  const [formDataPagoDirecto, setFormDataPagoDirecto] = useState({
    monto: '',
    descripcion: '',
    observaciones: '',
    pagarTotal: true,
  });
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: '',
    tieneCuentaCorriente: false,
    montoInicialCuentaCorriente: '',
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientesApi.obtenerTodos();
      setClientes(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const dataToSend: any = {
        nombre: formData.nombre,
        razonSocial: formData.razonSocial || undefined,
        dni: formData.dni || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        direccion: formData.direccion || undefined,
        observaciones: formData.observaciones || undefined,
        tieneCuentaCorriente: formData.tieneCuentaCorriente,
        saldoCuentaCorriente: formData.tieneCuentaCorriente && formData.montoInicialCuentaCorriente 
          ? parseFloat(formData.montoInicialCuentaCorriente) 
          : 0,
      };
      await clientesApi.crear(dataToSend);
      setSuccess('Cliente creado exitosamente');
      setShowModal(false);
      resetForm();
      cargarClientes();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      razonSocial: '',
      dni: '',
      telefono: '',
      email: '',
      direccion: '',
      observaciones: '',
      tieneCuentaCorriente: false,
      montoInicialCuentaCorriente: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setError(null);
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const handleVerCuentaCorriente = async (cliente: Cliente) => {
    if (!cliente.tieneCuentaCorriente) {
      setError('Este cliente no tiene cuenta corriente habilitada');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setClienteSeleccionado(cliente);
      const response = await clientesApi.obtenerCuentaCorriente(cliente.id);
      setCuentaCorriente(response.data);
      setShowModalCuentaCorriente(true);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cuenta corriente');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarCuentaCorriente = () => {
    setShowModalCuentaCorriente(false);
    setClienteSeleccionado(null);
    setCuentaCorriente(null);
  };

  const handleCerrarModalFactura = () => {
    setShowModalFactura(false);
    setFormDataFactura({
      numero: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      fechaVencimiento: '',
      montoTotal: '',
      descripcion: '',
      observaciones: '',
    });
  };

  const handleCargarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await clientesApi.cargarFactura(clienteSeleccionado.id, {
        ...formDataFactura,
        montoTotal: parseFloat(formDataFactura.montoTotal),
      });
      setSuccess('Factura cargada exitosamente');
      handleCerrarModalFactura();
      // Recargar cuenta corriente
      const response = await clientesApi.obtenerCuentaCorriente(clienteSeleccionado.id);
      setCuentaCorriente(response.data);
      cargarClientes();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalPago = (factura: any) => {
    setFacturaSeleccionada(factura);
    setFormDataPago({
      monto: factura.saldoPendiente.toString(),
      descripcion: '',
      observaciones: '',
      pagarTotal: true,
    });
    setShowModalPago(true);
  };

  const handleCerrarModalPago = () => {
    setShowModalPago(false);
    setFacturaSeleccionada(null);
    setFormDataPago({
      monto: '',
      descripcion: '',
      observaciones: '',
      pagarTotal: true,
    });
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaSeleccionada) return;
    try {
      setLoading(true);
      setError(null);
      await clientesApi.registrarPago(facturaSeleccionada.id, {
        monto: parseFloat(formDataPago.monto),
        descripcion: formDataPago.descripcion,
        observaciones: formDataPago.observaciones,
      });
      setSuccess('Pago registrado exitosamente');
      handleCerrarModalPago();
      // Recargar cuenta corriente
      if (clienteSeleccionado) {
        const response = await clientesApi.obtenerCuentaCorriente(clienteSeleccionado.id);
        setCuentaCorriente(response.data);
        cargarClientes();
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarModalPagoDirecto = () => {
    setShowModalPagoDirecto(false);
    setFormDataPagoDirecto({
      monto: '',
      descripcion: '',
      observaciones: '',
      pagarTotal: true,
    });
  };

  const handleRegistrarPagoDirecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSeleccionado || !cuentaCorriente) return;
    try {
      setLoading(true);
      setError(null);
      const monto = formDataPagoDirecto.pagarTotal 
        ? cuentaCorriente.deudaTotal 
        : parseFloat(formDataPagoDirecto.monto);
      
      await clientesApi.registrarPagoDirecto(clienteSeleccionado.id, {
        monto: monto,
        descripcion: formDataPagoDirecto.descripcion,
        observaciones: formDataPagoDirecto.observaciones,
      });
      setSuccess('Pago registrado exitosamente');
      handleCerrarModalPagoDirecto();
      // Recargar cuenta corriente
      const response = await clientesApi.obtenerCuentaCorriente(clienteSeleccionado.id);
      setCuentaCorriente(response.data);
      cargarClientes();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h1 className="page-title">👥 Clientes</h1>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          ➕ Agregar Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {loading && !clientes.length && (
        <div className="loading-container">
          <div className="loading-spinner">Cargando clientes...</div>
        </div>
      )}

      <div className="clientes-table-container">
        <table className="clientes-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Razón Social</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Cuenta Corriente</th>
              <th>Saldo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No hay clientes registrados. Agrega uno nuevo para comenzar.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.razonSocial || '-'}</td>
                  <td>{cliente.dni || '-'}</td>
                  <td>{cliente.telefono || '-'}</td>
                  <td>
                    <span className={`badge ${cliente.tieneCuentaCorriente ? 'badge-success' : 'badge-secondary'}`}>
                      {cliente.tieneCuentaCorriente ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className={cliente.saldoCuentaCorriente > 0 ? 'saldo-positivo' : ''}>
                    {formatearMonto(cliente.saldoCuentaCorriente)}
                  </td>
                  <td>
                    {cliente.tieneCuentaCorriente && (
                      <button
                        className="btn-small btn-primary"
                        onClick={() => handleVerCuentaCorriente(cliente)}
                      >
                        📊 Ver Cuenta
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Nuevo Cliente</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cliente-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Razón Social</label>
                <input
                  type="text"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.tieneCuentaCorriente}
                    onChange={(e) => setFormData({ ...formData, tieneCuentaCorriente: e.target.checked })}
                  />
                  <span>
                    💳 Tiene Cuenta Corriente
                    <small style={{ display: 'block', fontWeight: 'normal', color: '#6b7280', marginTop: '4px', fontSize: '13px' }}>
                      Permite al cliente realizar compras a crédito y pagar después
                    </small>
                  </span>
                </label>
              </div>

              {formData.tieneCuentaCorriente && (
                <div className="form-group">
                  <label>Monto Inicial de Cuenta Corriente</label>
                  <input
                    type="number"
                    value={formData.montoInicialCuentaCorriente}
                    onChange={(e) => setFormData({ ...formData, montoInicialCuentaCorriente: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <small style={{ display: 'block', color: '#6b7280', marginTop: '4px', fontSize: '13px' }}>
                    Monto inicial de deuda o saldo a favor del cliente
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cuenta Corriente */}
      {showModalCuentaCorriente && clienteSeleccionado && cuentaCorriente && (
        <div className="modal-overlay" onClick={handleCerrarCuentaCorriente}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Cuenta Corriente - {clienteSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={handleCerrarCuentaCorriente}>×</button>
            </div>
            <div className="modal-body">
              <div className="cc-resumen">
                <div className="cc-resumen-card">
                  <div className="cc-resumen-label">Deuda Total</div>
                  <div className="cc-resumen-valor saldo-total">{formatearMonto(cuentaCorriente.deudaTotal)}</div>
                </div>
                <div className="cc-resumen-card">
                  <div className="cc-resumen-label">Facturas Pendientes</div>
                  <div className="cc-resumen-valor">{cuentaCorriente.facturasPendientes.length}</div>
                </div>
              </div>

              <div className="cc-actions">
                <button 
                  className="btn-primary btn-pago-total" 
                  onClick={() => {
                    setFormDataPagoDirecto({
                      monto: cuentaCorriente.deudaTotal.toString(),
                      descripcion: '',
                      observaciones: '',
                      pagarTotal: true,
                    });
                    setShowModalPagoDirecto(true);
                  }}
                  disabled={cuentaCorriente.deudaTotal <= 0}
                >
                  ✅ Pago Total
                </button>
                <button 
                  className="btn-primary btn-pago-parcial" 
                  onClick={() => {
                    setFormDataPagoDirecto({
                      monto: '',
                      descripcion: '',
                      observaciones: '',
                      pagarTotal: false,
                    });
                    setShowModalPagoDirecto(true);
                  }}
                  disabled={cuentaCorriente.deudaTotal <= 0}
                >
                  💵 Pago Parcial
                </button>
              </div>

              {cuentaCorriente.facturasPendientes.length > 0 && (
                <div className="cc-seccion">
                  <h3>📋 Facturas Pendientes</h3>
                  <div className="cc-tabla-container">
                    <table className="cc-tabla">
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Fecha</th>
                          <th>Vencimiento</th>
                          <th>Total</th>
                          <th>Pagado</th>
                          <th>Saldo</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuentaCorriente.facturasPendientes.map((factura: any) => (
                          <tr key={factura.id}>
                            <td>{factura.numero}</td>
                            <td>{format(new Date(factura.fecha), 'dd/MM/yyyy')}</td>
                            <td>
                              <span className={factura.estaVencida ? 'vencida' : factura.estaPorVencer ? 'por-vencer' : ''}>
                                {format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy')}
                                {factura.estaVencida && ' ⚠️ Vencida'}
                                {factura.estaPorVencer && !factura.estaVencida && ' ⏰ Por vencer'}
                              </span>
                            </td>
                            <td>{formatearMonto(factura.montoTotal)}</td>
                            <td>{formatearMonto(factura.montoPagado)}</td>
                            <td><strong>{formatearMonto(factura.saldoPendiente)}</strong></td>
                            <td>
                              <button
                                className="btn-small btn-primary"
                                onClick={() => handleAbrirModalPago(factura)}
                                disabled={factura.saldoPendiente <= 0}
                              >
                                💰 Pagar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {cuentaCorriente.movimientos && cuentaCorriente.movimientos.length > 0 && (
                <div className="cc-seccion">
                  <h3>📜 Historial de Movimientos</h3>
                  <div className="cc-tabla-container">
                    <table className="cc-tabla">
                      <thead>
                        <tr>
                          <th>Fecha y Hora</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Monto</th>
                          <th>Saldo Anterior</th>
                          <th>Saldo Actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuentaCorriente.movimientos.map((mov: any) => (
                          <tr key={mov.id}>
                            <td>{format(new Date(mov.createdAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                            <td>
                              <span className={`badge ${mov.tipo.includes('PAGO') ? 'badge-success' : 'badge-warning'}`}>
                                {mov.tipo}
                              </span>
                            </td>
                            <td>{mov.descripcion}</td>
                            <td className={mov.tipo.includes('PAGO') ? 'text-success' : 'text-danger'}>
                              {mov.tipo.includes('PAGO') ? '-' : '+'}{formatearMonto(mov.monto)}
                            </td>
                            <td>{formatearMonto(mov.saldoAnterior)}</td>
                            <td><strong>{formatearMonto(mov.saldoActual)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cargar Factura */}
      {showModalFactura && clienteSeleccionado && (
        <div className="modal-overlay" onClick={handleCerrarModalFactura}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cargar Factura - {clienteSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={handleCerrarModalFactura}>×</button>
            </div>
            <form onSubmit={handleCargarFactura} className="modal-body">
              <div className="form-group">
                <label>Número de Factura *</label>
                <input
                  type="text"
                  value={formDataFactura.numero}
                  onChange={(e) => setFormDataFactura({ ...formDataFactura, numero: e.target.value })}
                  required
                  placeholder="Ej: 0001-00001234"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formDataFactura.fecha}
                    onChange={(e) => setFormDataFactura({ ...formDataFactura, fecha: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    value={formDataFactura.fechaVencimiento}
                    onChange={(e) => setFormDataFactura({ ...formDataFactura, fechaVencimiento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Monto Total *</label>
                <input
                  type="number"
                  value={formDataFactura.montoTotal}
                  onChange={(e) => setFormDataFactura({ ...formDataFactura, montoTotal: e.target.value })}
                  required
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formDataFactura.descripcion}
                  onChange={(e) => setFormDataFactura({ ...formDataFactura, descripcion: e.target.value })}
                  placeholder="Descripción de la factura"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formDataFactura.observaciones}
                  onChange={(e) => setFormDataFactura({ ...formDataFactura, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCerrarModalFactura}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Cargando...' : 'Cargar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registrar Pago */}
      {showModalPago && facturaSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarModalPago}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Registrar Pago - Factura {facturaSeleccionada.numero}</h2>
              <button className="modal-close" onClick={handleCerrarModalPago}>×</button>
            </div>
            <form onSubmit={handleRegistrarPago} className="modal-body">
              <div className="pago-info-card">
                <div className="pago-info-item">
                  <span className="pago-info-label">Total Factura:</span>
                  <span className="pago-info-value">{formatearMonto(facturaSeleccionada.montoTotal)}</span>
                </div>
                <div className="pago-info-item">
                  <span className="pago-info-label">Ya Pagado:</span>
                  <span className="pago-info-value">{formatearMonto(facturaSeleccionada.montoPagado)}</span>
                </div>
                <div className="pago-info-item highlight">
                  <span className="pago-info-label">Saldo Pendiente:</span>
                  <span className="pago-info-value">{formatearMonto(facturaSeleccionada.saldoPendiente)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de Pago *</label>
                <div className="pago-opciones">
                  <label className={`pago-opcion-card ${formDataPago.pagarTotal ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={formDataPago.pagarTotal}
                      onChange={() => {
                        setFormDataPago({
                          ...formDataPago,
                          pagarTotal: true,
                          monto: facturaSeleccionada.saldoPendiente.toString(),
                        });
                      }}
                    />
                    <div className="pago-opcion-content">
                      <span className="pago-opcion-icon">✅</span>
                      <span className="pago-opcion-title">Pago Total</span>
                      <span className="pago-opcion-desc">{formatearMonto(facturaSeleccionada.saldoPendiente)}</span>
                    </div>
                  </label>
                  <label className={`pago-opcion-card ${!formDataPago.pagarTotal ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={!formDataPago.pagarTotal}
                      onChange={() => {
                        setFormDataPago({
                          ...formDataPago,
                          pagarTotal: false,
                          monto: '',
                        });
                      }}
                    />
                    <div className="pago-opcion-content">
                      <span className="pago-opcion-icon">💵</span>
                      <span className="pago-opcion-title">Pago Parcial</span>
                      <span className="pago-opcion-desc">Ingresa el monto a pagar</span>
                    </div>
                  </label>
                </div>
              </div>

              {!formDataPago.pagarTotal && (
                <div className="form-group">
                  <label>Monto a Pagar *</label>
                  <input
                    type="number"
                    value={formDataPago.monto}
                    onChange={(e) => {
                      const valor = e.target.value;
                      const maximo = facturaSeleccionada.saldoPendiente;
                      if (valor === '' || (parseFloat(valor) >= 0 && parseFloat(valor) <= maximo)) {
                        setFormDataPago({ ...formDataPago, monto: valor });
                      }
                    }}
                    required
                    placeholder="0.00"
                    min="0"
                    max={facturaSeleccionada.saldoPendiente}
                    step="0.01"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>
                    Máximo: {formatearMonto(facturaSeleccionada.saldoPendiente)}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formDataPago.descripcion}
                  onChange={(e) => setFormDataPago({ ...formDataPago, descripcion: e.target.value })}
                  placeholder="Ej: Pago en efectivo, Transferencia bancaria, etc."
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formDataPago.observaciones}
                  onChange={(e) => setFormDataPago({ ...formDataPago, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Observaciones adicionales sobre el pago..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCerrarModalPago}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading || (!formDataPago.pagarTotal && (!formDataPago.monto || parseFloat(formDataPago.monto) <= 0))}>
                  {loading ? 'Registrando...' : formDataPago.pagarTotal ? 'Registrar Pago Total' : 'Registrar Pago Parcial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Pago Directo (Total o Parcial) */}
      {showModalPagoDirecto && clienteSeleccionado && cuentaCorriente && (
        <div className="modal-overlay" onClick={handleCerrarModalPagoDirecto}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Registrar Pago - {clienteSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={handleCerrarModalPagoDirecto}>×</button>
            </div>
            <form onSubmit={handleRegistrarPagoDirecto} className="modal-body">
              <div className="pago-info-card">
                <div className="pago-info-item highlight">
                  <span className="pago-info-label">Deuda Total:</span>
                  <span className="pago-info-value">{formatearMonto(cuentaCorriente.deudaTotal)}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de Pago *</label>
                <div className="pago-opciones">
                  <label className={`pago-opcion-card ${formDataPagoDirecto.pagarTotal ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoPagoDirecto"
                      checked={formDataPagoDirecto.pagarTotal}
                      onChange={() => {
                        setFormDataPagoDirecto({
                          ...formDataPagoDirecto,
                          pagarTotal: true,
                          monto: cuentaCorriente.deudaTotal.toString(),
                        });
                      }}
                    />
                    <div className="pago-opcion-content">
                      <span className="pago-opcion-icon">✅</span>
                      <span className="pago-opcion-title">Pago Total</span>
                      <span className="pago-opcion-desc">{formatearMonto(cuentaCorriente.deudaTotal)}</span>
                    </div>
                  </label>
                  <label className={`pago-opcion-card ${!formDataPagoDirecto.pagarTotal ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tipoPagoDirecto"
                      checked={!formDataPagoDirecto.pagarTotal}
                      onChange={() => {
                        setFormDataPagoDirecto({
                          ...formDataPagoDirecto,
                          pagarTotal: false,
                          monto: '',
                        });
                      }}
                    />
                    <div className="pago-opcion-content">
                      <span className="pago-opcion-icon">💵</span>
                      <span className="pago-opcion-title">Pago Parcial</span>
                      <span className="pago-opcion-desc">Ingresa el monto a pagar</span>
                    </div>
                  </label>
                </div>
              </div>

              {!formDataPagoDirecto.pagarTotal && (
                <div className="form-group">
                  <label>Monto a Pagar *</label>
                  <input
                    type="number"
                    value={formDataPagoDirecto.monto}
                    onChange={(e) => {
                      const valor = e.target.value;
                      const maximo = cuentaCorriente.deudaTotal;
                      if (valor === '' || (parseFloat(valor) >= 0 && parseFloat(valor) <= maximo)) {
                        setFormDataPagoDirecto({ ...formDataPagoDirecto, monto: valor });
                      }
                    }}
                    required
                    placeholder="0.00"
                    min="0"
                    max={cuentaCorriente.deudaTotal}
                    step="0.01"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>
                    Máximo: {formatearMonto(cuentaCorriente.deudaTotal)}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formDataPagoDirecto.descripcion}
                  onChange={(e) => setFormDataPagoDirecto({ ...formDataPagoDirecto, descripcion: e.target.value })}
                  placeholder="Ej: Pago en efectivo, Transferencia bancaria, etc."
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formDataPagoDirecto.observaciones}
                  onChange={(e) => setFormDataPagoDirecto({ ...formDataPagoDirecto, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Observaciones adicionales sobre el pago..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCerrarModalPagoDirecto}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading || (!formDataPagoDirecto.pagarTotal && (!formDataPagoDirecto.monto || parseFloat(formDataPagoDirecto.monto) <= 0))}>
                  {loading ? 'Registrando...' : formDataPagoDirecto.pagarTotal ? 'Registrar Pago Total' : 'Registrar Pago Parcial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientesPage;











