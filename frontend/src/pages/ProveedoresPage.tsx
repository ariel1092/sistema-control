import { useState, useEffect, useCallback } from 'react';
import { format, differenceInDays } from 'date-fns';
import { proveedoresApi } from '../services/api';
import './ProveedoresPage.css';

interface Proveedor {
  id: string;
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  domicilio?: string;
  telefono?: string;
  email?: string;
  categoria: string;
  productosProvee: string[];
  condicionesCompra: string;
  formaPagoHabitual: string;
  vendedorAsignado?: string;
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORIAS = [
  'FERRETERIA',
  'PLOMERIA',
  'ELECTRICIDAD',
  'CONSTRUCCION',
  'PINTURAS',
  'HERRAMIENTAS',
  'SEGURIDAD',
  'JARDINERIA',
  'OTROS',
];

const FORMAS_PAGO = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'MERCADOPAGO',
  'CUENTA_CORRIENTE',
  'CHEQUE',
];

interface CuentaCorriente {
  proveedorId: string;
  deudaTotal: number;
  facturasPendientes: Array<{
    id: string;
    numero: string;
    fecha: string;
    fechaVencimiento: string;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    diasHastaVencimiento: number;
    estaVencida: boolean;
    estaPorVencer: boolean;
  }>;
  remitosSinFacturar: Array<{
    id: string;
    numero: string;
    fecha: string;
    total: number;
  }>;
  ordenesCompraPendientes: Array<{
    id: string;
    numero: string;
    fecha: string;
    fechaEstimadaEntrega?: string;
    total: number;
    estado: string;
  }>;
  movimientos: Array<{
    id: string;
    tipo: string;
    fecha: string;
    monto: number;
    descripcion: string;
    saldoAnterior: number;
    saldoActual: number;
  }>;
}

function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [cuentaCorriente, setCuentaCorriente] = useState<CuentaCorriente | null>(null);
  const [loadingCC, setLoadingCC] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [montoPago, setMontoPago] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    cuit: '',
    domicilio: '',
    telefono: '',
    email: '',
    categoria: 'OTROS',
    productosProvee: [] as string[],
    condicionesCompra: '',
    formaPagoHabitual: 'CUENTA_CORRIENTE',
    vendedorAsignado: '',
    activo: true,
    observaciones: '',
  });
  const [nuevoProducto, setNuevoProducto] = useState('');

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await proveedoresApi.obtenerTodos();
      setProveedores(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await proveedoresApi.crear(formData);
      setSuccess('Proveedor creado exitosamente');
      setShowModal(false);
      resetForm();
      cargarProveedores();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al crear proveedor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      razonSocial: '',
      cuit: '',
      domicilio: '',
      telefono: '',
      email: '',
      categoria: 'OTROS',
      productosProvee: [],
      condicionesCompra: '',
      formaPagoHabitual: 'CUENTA_CORRIENTE',
      vendedorAsignado: '',
      activo: true,
      observaciones: '',
    });
    setNuevoProducto('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setError(null);
  };

  const agregarProducto = () => {
    if (nuevoProducto.trim()) {
      setFormData({
        ...formData,
        productosProvee: [...formData.productosProvee, nuevoProducto.trim()],
      });
      setNuevoProducto('');
    }
  };

  const eliminarProducto = (index: number) => {
    setFormData({
      ...formData,
      productosProvee: formData.productosProvee.filter((_, i) => i !== index),
    });
  };

  const formatearCategoria = (categoria: string) => {
    return categoria.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const handleClickProveedor = useCallback(async (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor);
    setLoadingCC(true);
    setError(null);
    try {
      const response = await proveedoresApi.obtenerCuentaCorriente(proveedor.id);
      setCuentaCorriente(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cuenta corriente');
    } finally {
      setLoadingCC(false);
    }
  }, []);

  const handleCerrarModalDetalle = () => {
    setProveedorSeleccionado(null);
    setCuentaCorriente(null);
    setError(null);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaSeleccionada || !montoPago) return;

    try {
      setLoading(true);
      setError(null);
      await proveedoresApi.registrarPago(facturaSeleccionada.id, {
        monto: parseFloat(montoPago),
        descripcion: `Pago parcial - Factura ${facturaSeleccionada.numero}`,
      });
      setSuccess('Pago registrado exitosamente');
      setShowModalPago(false);
      setMontoPago('');
      setFacturaSeleccionada(null);
      // Recargar cuenta corriente
      if (proveedorSeleccionado) {
        await handleClickProveedor(proveedorSeleccionado);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proveedores-page">
      <div className="proveedores-header">
        <h1 className="page-title">🏭 Proveedores</h1>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          ➕ Agregar Nuevo Proveedor
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading && !proveedores.length ? (
        <div className="loading">Cargando proveedores...</div>
      ) : (
        <div className="proveedores-grid">
          {proveedores.map((proveedor) => (
            <div
              key={proveedor.id}
              className={`proveedor-card ${!proveedor.activo ? 'inactivo' : ''} clickeable`}
              onClick={() => handleClickProveedor(proveedor)}
              style={{ cursor: 'pointer' }}
            >
              <div className="proveedor-header">
                <h3>{proveedor.nombre}</h3>
                <span className={`badge ${proveedor.activo ? 'activo' : 'inactivo'}`}>
                  {proveedor.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="proveedor-body">
                {proveedor.razonSocial && (
                  <p><strong>Razón Social:</strong> {proveedor.razonSocial}</p>
                )}
                {proveedor.cuit && (
                  <p><strong>CUIT:</strong> {proveedor.cuit}</p>
                )}
                {proveedor.telefono && (
                  <p><strong>Teléfono:</strong> {proveedor.telefono}</p>
                )}
                {proveedor.email && (
                  <p><strong>Email:</strong> {proveedor.email}</p>
                )}
                <p><strong>Categoría:</strong> {formatearCategoria(proveedor.categoria)}</p>
                <p><strong>Forma de Pago:</strong> {formatearCategoria(proveedor.formaPagoHabitual)}</p>
                {proveedor.condicionesCompra && (
                  <p><strong>Condiciones:</strong> {proveedor.condicionesCompra}</p>
                )}
                {proveedor.productosProvee.length > 0 && (
                  <div>
                    <strong>Productos:</strong>
                    <ul>
                      {proveedor.productosProvee.map((prod, idx) => (
                        <li key={idx}>{prod}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Nuevo Proveedor</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
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

              <div className="form-group">
                <label>CUIT</label>
                <input
                  type="text"
                  value={formData.cuit}
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <div className="form-group">
                <label>Domicilio</label>
                <input
                  type="text"
                  value={formData.domicilio}
                  onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {formatearCategoria(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Forma de Pago Habitual *</label>
                  <select
                    value={formData.formaPagoHabitual}
                    onChange={(e) => setFormData({ ...formData, formaPagoHabitual: e.target.value })}
                    required
                  >
                    {FORMAS_PAGO.map((fp) => (
                      <option key={fp} value={fp}>
                        {formatearCategoria(fp)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Condiciones de Compra</label>
                <input
                  type="text"
                  value={formData.condicionesCompra}
                  onChange={(e) => setFormData({ ...formData, condicionesCompra: e.target.value })}
                  placeholder="Ej: 30/60 días"
                />
              </div>

              <div className="form-group">
                <label>Vendedor Asignado</label>
                <input
                  type="text"
                  value={formData.vendedorAsignado}
                  onChange={(e) => setFormData({ ...formData, vendedorAsignado: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Productos que Provee</label>
                <div className="productos-input">
                  <input
                    type="text"
                    value={nuevoProducto}
                    onChange={(e) => setNuevoProducto(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarProducto();
                      }
                    }}
                    placeholder="Agregar producto y presionar Enter"
                  />
                  <button type="button" onClick={agregarProducto} className="btn-secondary">
                    ➕
                  </button>
                </div>
                {formData.productosProvee.length > 0 && (
                  <ul className="productos-lista">
                    {formData.productosProvee.map((prod, idx) => (
                      <li key={idx}>
                        {prod}
                        <button
                          type="button"
                          onClick={() => eliminarProducto(idx)}
                          className="btn-remove"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle del Proveedor con Cuenta Corriente */}
      {proveedorSeleccionado && (
        <div className="modal-overlay" onClick={handleCerrarModalDetalle}>
          <div className="modal-content modal-proveedor-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 {proveedorSeleccionado.nombre} - Cuenta Corriente</h2>
              <button className="modal-close" onClick={handleCerrarModalDetalle}>×</button>
            </div>

            <div className="modal-body">
              {loadingCC ? (
                <div className="loading">Cargando cuenta corriente...</div>
              ) : cuentaCorriente ? (
                <>
                  {/* Resumen de Deuda */}
                  <div className="cc-resumen">
                    <div className="cc-resumen-card">
                      <div className="cc-resumen-label">Deuda Total</div>
                      <div className={`cc-resumen-monto ${cuentaCorriente.deudaTotal > 0 ? 'deuda' : 'positivo'}`}>
                        {formatearMonto(cuentaCorriente.deudaTotal)}
                      </div>
                    </div>
                    <div className="cc-resumen-card">
                      <div className="cc-resumen-label">Facturas Pendientes</div>
                      <div className="cc-resumen-valor">{cuentaCorriente.facturasPendientes.length}</div>
                    </div>
                    <div className="cc-resumen-card">
                      <div className="cc-resumen-label">Remitos Sin Facturar</div>
                      <div className="cc-resumen-valor">{cuentaCorriente.remitosSinFacturar.length}</div>
                    </div>
                    <div className="cc-resumen-card">
                      <div className="cc-resumen-label">Órdenes Pendientes</div>
                      <div className="cc-resumen-valor">{cuentaCorriente.ordenesCompraPendientes.length}</div>
                    </div>
                  </div>

                  {/* Facturas Pendientes */}
                  {cuentaCorriente.facturasPendientes.length > 0 && (
                    <div className="cc-seccion">
                      <h3>📄 Facturas Pendientes</h3>
                      <div className="cc-tabla-container">
                        <table className="cc-tabla">
                          <thead>
                            <tr>
                              <th>Número</th>
                              <th>Fecha</th>
                              <th>Vencimiento</th>
                              <th>Días Restantes</th>
                              <th>Total</th>
                              <th>Pagado</th>
                              <th>Pendiente</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuentaCorriente.facturasPendientes.map((factura) => (
                              <tr
                                key={factura.id}
                                className={
                                  factura.estaVencida
                                    ? 'factura-vencida'
                                    : factura.estaPorVencer
                                    ? 'factura-por-vencer'
                                    : ''
                                }
                              >
                                <td>{factura.numero}</td>
                                <td>{format(new Date(factura.fecha), 'dd/MM/yyyy')}</td>
                                <td>{format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy')}</td>
                                <td>
                                  <span
                                    className={
                                      factura.diasHastaVencimiento < 0
                                        ? 'dias-negativo'
                                        : factura.diasHastaVencimiento <= 5
                                        ? 'dias-alerta'
                                        : ''
                                    }
                                  >
                                    {factura.diasHastaVencimiento < 0
                                      ? `Vencida (${Math.abs(factura.diasHastaVencimiento)} días)`
                                      : `${factura.diasHastaVencimiento} días`}
                                  </span>
                                </td>
                                <td>{formatearMonto(factura.total)}</td>
                                <td>{formatearMonto(factura.montoPagado)}</td>
                                <td><strong>{formatearMonto(factura.saldoPendiente)}</strong></td>
                                <td>
                                  <button
                                    className="btn-small btn-primary"
                                    onClick={() => {
                                      setFacturaSeleccionada(factura);
                                      setMontoPago(factura.saldoPendiente.toString());
                                      setShowModalPago(true);
                                    }}
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

                  {/* Remitos Sin Facturar */}
                  {cuentaCorriente.remitosSinFacturar.length > 0 && (
                    <div className="cc-seccion">
                      <h3>📋 Remitos Sin Facturar</h3>
                      <div className="cc-tabla-container">
                        <table className="cc-tabla">
                          <thead>
                            <tr>
                              <th>Número</th>
                              <th>Fecha</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuentaCorriente.remitosSinFacturar.map((remito) => (
                              <tr key={remito.id}>
                                <td>{remito.numero}</td>
                                <td>{format(new Date(remito.fecha), 'dd/MM/yyyy')}</td>
                                <td>{formatearMonto(remito.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Órdenes de Compra Pendientes */}
                  {cuentaCorriente.ordenesCompraPendientes.length > 0 && (
                    <div className="cc-seccion">
                      <h3>🛒 Órdenes de Compra Pendientes</h3>
                      <div className="cc-tabla-container">
                        <table className="cc-tabla">
                          <thead>
                            <tr>
                              <th>Número</th>
                              <th>Fecha</th>
                              <th>Entrega Estimada</th>
                              <th>Total</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuentaCorriente.ordenesCompraPendientes.map((orden) => (
                              <tr key={orden.id}>
                                <td>{orden.numero}</td>
                                <td>{format(new Date(orden.fecha), 'dd/MM/yyyy')}</td>
                                <td>
                                  {orden.fechaEstimadaEntrega
                                    ? format(new Date(orden.fechaEstimadaEntrega), 'dd/MM/yyyy')
                                    : '-'}
                                </td>
                                <td>{formatearMonto(orden.total)}</td>
                                <td>
                                  <span className={`badge-estado ${orden.estado.toLowerCase()}`}>
                                    {orden.estado}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Historial de Movimientos */}
                  {cuentaCorriente.movimientos.length > 0 && (
                    <div className="cc-seccion">
                      <h3>📜 Historial de Movimientos</h3>
                      <div className="cc-tabla-container">
                        <table className="cc-tabla">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Tipo</th>
                              <th>Descripción</th>
                              <th>Monto</th>
                              <th>Saldo Anterior</th>
                              <th>Saldo Actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cuentaCorriente.movimientos.map((mov) => (
                              <tr key={mov.id}>
                                <td>{format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}</td>
                                <td>
                                  <span className={`badge-tipo ${mov.tipo.toLowerCase().replace(/_/g, '-')}`}>
                                    {mov.tipo.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td>{mov.descripcion}</td>
                                <td className={mov.tipo.includes('PAGO') || mov.tipo.includes('CREDITO') ? 'monto-positivo' : 'monto-negativo'}>
                                  {mov.tipo.includes('PAGO') || mov.tipo.includes('CREDITO') ? '-' : '+'}
                                  {formatearMonto(mov.monto)}
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

                  {cuentaCorriente.facturasPendientes.length === 0 &&
                    cuentaCorriente.remitosSinFacturar.length === 0 &&
                    cuentaCorriente.ordenesCompraPendientes.length === 0 && (
                      <div className="cc-vacio">
                        <p>✅ No hay pendientes para este proveedor</p>
                      </div>
                    )}
                </>
              ) : (
                <div className="error">Error al cargar cuenta corriente</div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCerrarModalDetalle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showModalPago && facturaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModalPago(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Registrar Pago</h2>
              <button className="modal-close" onClick={() => setShowModalPago(false)}>×</button>
            </div>
            <form onSubmit={handleRegistrarPago} className="modal-body">
              <div className="form-group">
                <label>Factura</label>
                <input type="text" value={facturaSeleccionada.numero} disabled />
              </div>
              <div className="form-group">
                <label>Total Factura</label>
                <input type="text" value={formatearMonto(facturaSeleccionada.total)} disabled />
              </div>
              <div className="form-group">
                <label>Ya Pagado</label>
                <input type="text" value={formatearMonto(facturaSeleccionada.montoPagado)} disabled />
              </div>
              <div className="form-group">
                <label>Saldo Pendiente</label>
                <input type="text" value={formatearMonto(facturaSeleccionada.saldoPendiente)} disabled />
              </div>
              <div className="form-group">
                <label>Monto del Pago *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={facturaSeleccionada.saldoPendiente}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <small>Máximo: {formatearMonto(facturaSeleccionada.saldoPendiente)}</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModalPago(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProveedoresPage;

