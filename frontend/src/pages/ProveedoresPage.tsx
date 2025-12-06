import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
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
  formaPagoHabitual: string;
  vendedorAsignado?: string;
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
  plazoCuentaCorriente?: number;
  descuento?: number;
  saldoPendiente?: {
    cantidadPendientes: number;
    saldoTotal: number;
    saldoProximoVencer: number;
  };
  resumenFacturas?: {
    cantidadPendientes: number;
    saldoTotal: number;
    saldoProximoVencer: number;
  };
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
  'CUENTA_CORRIENTE',
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
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [cuentaCorriente, setCuentaCorriente] = useState<CuentaCorriente | null>(null);
  const [loadingCC, setLoadingCC] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [showModalDetalleFactura, setShowModalDetalleFactura] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [detalleFactura, setDetalleFactura] = useState<any>(null);
  const [pagarTotal, setPagarTotal] = useState(true);
  const [montoPagoFactura, setMontoPagoFactura] = useState('');
  const [showModalFactura, setShowModalFactura] = useState(false);
  const [showModalFacturas, setShowModalFacturas] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [proveedorParaFactura, setProveedorParaFactura] = useState<Proveedor | null>(null);
  const [formDataFactura, setFormDataFactura] = useState({
    numero: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    fechaVencimiento: '',
    diasParaPagar: '',
    importeBruto: '',
    descuento: '0',
    observaciones: '',
    detalles: [] as any[],
  });
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    cuit: '',
    domicilio: '',
    telefono: '',
    email: '',
    categoria: 'OTROS',
    formaPagoHabitual: 'CUENTA_CORRIENTE',
    vendedorAsignado: '',
    activo: true,
    observaciones: '',
    plazoCuentaCorriente: '',
    descuento: '0',
  });

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
      // Convertir descuento a número si existe
      const dataToSend = {
        ...formData,
        descuento: formData.descuento ? parseFloat(formData.descuento) : undefined,
        plazoCuentaCorriente: formData.plazoCuentaCorriente || undefined,
      };
      await proveedoresApi.crear(dataToSend);
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
      formaPagoHabitual: 'CUENTA_CORRIENTE',
      vendedorAsignado: '',
      activo: true,
      observaciones: '',
      plazoCuentaCorriente: '',
      descuento: '0',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setError(null);
  };

  const handleEditarProveedor = (proveedor: Proveedor) => {
    setProveedorEditando(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      razonSocial: proveedor.razonSocial || '',
      cuit: proveedor.cuit || '',
      domicilio: proveedor.domicilio || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      categoria: proveedor.categoria,
      formaPagoHabitual: proveedor.formaPagoHabitual,
      vendedorAsignado: proveedor.vendedorAsignado || '',
      activo: proveedor.activo,
      observaciones: proveedor.observaciones || '',
      plazoCuentaCorriente: proveedor.plazoCuentaCorriente?.toString() || '',
      descuento: proveedor.descuento?.toString() || '0',
    });
    setShowModalEditar(true);
  };

  const handleCerrarModalEditar = () => {
    setShowModalEditar(false);
    setProveedorEditando(null);
    resetForm();
    setError(null);
  };

  const handleActualizarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorEditando) return;
    
    try {
      setLoading(true);
      setError(null);
      const dataToSend = {
        ...formData,
        descuento: formData.descuento ? parseFloat(formData.descuento) : undefined,
        plazoCuentaCorriente: formData.plazoCuentaCorriente ? parseFloat(formData.plazoCuentaCorriente) : undefined,
      };
      await proveedoresApi.actualizar(proveedorEditando.id, dataToSend);
      setSuccess('Proveedor actualizado exitosamente');
      setShowModalEditar(false);
      setProveedorEditando(null);
      resetForm();
      cargarProveedores();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar proveedor');
    } finally {
      setLoading(false);
    }
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
      // También cargar todas las facturas
      try {
        const facturasResponse = await proveedoresApi.obtenerFacturas(proveedor.id);
        console.log('Facturas recibidas:', facturasResponse);
        console.log('Facturas data:', facturasResponse.data);
        setFacturas(facturasResponse.data || []);
      } catch (facturasErr: any) {
        console.error('Error al cargar facturas:', facturasErr);
        setFacturas([]);
        // No mostramos error aquí, solo dejamos el array vacío
      }
      setShowModalFacturas(true);
    } catch (err: any) {
      console.error('Error al cargar cuenta corriente:', err);
      setError(err.message || 'Error al cargar cuenta corriente');
    } finally {
      setLoadingCC(false);
    }
  }, []);

  const handleCargarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorParaFactura) {
      setError('Debe seleccionar un proveedor');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const importeBruto = parseFloat(formDataFactura.importeBruto) || 0;
      const descuento = parseFloat(formDataFactura.descuento) || 0;
      const descuentoMonto = (importeBruto * descuento) / 100;
      const subtotal = importeBruto - descuentoMonto;
      // El IVA se calcula por item en el backend, no se agrega globalmente aquí
      const total = subtotal;

      const facturaData = {
        numero: formDataFactura.numero,
        fecha: new Date(formDataFactura.fecha),
        fechaVencimiento: new Date(formDataFactura.fechaVencimiento),
        total,
        descuento,
        observaciones: formDataFactura.observaciones,
        detalles: formDataFactura.detalles.length > 0 
          ? formDataFactura.detalles 
          : [{
              codigoProducto: 'GEN001',
              nombreProducto: 'Producto Genérico',
              cantidad: 1,
              precioUnitario: importeBruto,
              descuento: descuento,
              iva: 0, // IVA opcional, se puede configurar por item si es necesario
            }],
      };

      await proveedoresApi.cargarFactura(proveedorParaFactura.id, facturaData);
      setSuccess('Factura cargada exitosamente');
      setShowModalFactura(false);
      resetFormFactura();
      // Recargar proveedores para actualizar el resumen financiero
      await cargarProveedores();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const resetFormFactura = () => {
    setFormDataFactura({
      numero: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      fechaVencimiento: '',
      diasParaPagar: '',
      importeBruto: '',
      descuento: '0',
      observaciones: '',
      detalles: [],
    });
    setProveedorParaFactura(null);
  };

  const calcularFechaVencimiento = (dias: string, fechaBase?: string) => {
    if (!dias || isNaN(parseInt(dias))) return '';
    const fecha = fechaBase ? new Date(fechaBase) : new Date(formDataFactura.fecha || format(new Date(), 'yyyy-MM-dd'));
    fecha.setDate(fecha.getDate() + parseInt(dias));
    return format(fecha, 'yyyy-MM-dd');
  };

  const handleDiasParaPagarChange = (dias: string) => {
    setFormDataFactura({
      ...formDataFactura,
      diasParaPagar: dias,
      fechaVencimiento: calcularFechaVencimiento(dias),
    });
  };

  const handleCerrarModalDetalle = () => {
    setProveedorSeleccionado(null);
    setCuentaCorriente(null);
    setError(null);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaSeleccionada) return;

    const monto = pagarTotal 
      ? facturaSeleccionada.saldoPendiente 
      : parseFloat(montoPagoFactura || '0');

    if (monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (monto > facturaSeleccionada.saldoPendiente) {
      setError('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await proveedoresApi.registrarPago(facturaSeleccionada.id, {
        monto: monto,
        metodoPago: 'EFECTIVO',
        observaciones: pagarTotal 
          ? `Pago total - Factura ${facturaSeleccionada.numero}`
          : `Pago parcial - Factura ${facturaSeleccionada.numero}`,
      });
      setSuccess('Pago registrado exitosamente');
      setShowModalPago(false);
      setShowModalDetalleFactura(false);
      setMontoPagoFactura('');
      setPagarTotal(true);
      setFacturaSeleccionada(null);
      setDetalleFactura(null);
      // Recargar proveedores y facturas
      await cargarProveedores();
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
        <div className="header-buttons">
          <button
            className="btn-primary"
            onClick={() => {
              setProveedorParaFactura(null);
              setShowModalFactura(true);
            }}
          >
            📄 Cargar Factura
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            ➕ Agregar Nuevo Proveedor
          </button>
        </div>
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
              className={`proveedor-card ${!proveedor.activo ? 'inactivo' : ''}`}
            >
              <div className="proveedor-header">
                <h3 onClick={() => handleClickProveedor(proveedor)} style={{ cursor: 'pointer', flex: 1 }}>
                  {proveedor.nombre}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn-edit-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditarProveedor(proveedor);
                    }}
                    title="Editar proveedor"
                  >
                    ✏️
                  </button>
                  <span className={`badge ${proveedor.activo ? 'activo' : 'inactivo'}`}>
                    {proveedor.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
              <div className="proveedor-body">
                <div className="resumen-financiero">
                  <div className="resumen-item-card">
                    <span className="resumen-label-card">Facturas Pendientes:</span>
                    <span className="resumen-value-card">
                      {proveedor.resumenFacturas?.cantidadPendientes || proveedor.saldoPendiente?.cantidadPendientes || 0}
                    </span>
                  </div>
                  <div className="resumen-item-card">
                    <span className="resumen-label-card">Saldo Total a Pagar:</span>
                    <span className="resumen-value-card saldo-total">
                      {formatearMonto(proveedor.resumenFacturas?.saldoTotal || proveedor.saldoPendiente?.saldoTotal || 0)}
                    </span>
                  </div>
                  <div className="resumen-item-card">
                    <span className="resumen-label-card">Saldo Más Próximo a Vencer:</span>
                    <span className="resumen-value-card saldo-proximo">
                      {formatearMonto(proveedor.resumenFacturas?.saldoProximoVencer || proveedor.saldoPendiente?.saldoProximoVencer || 0)}
                    </span>
                  </div>
                </div>
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
                <label>Vendedor Asignado</label>
                <input
                  type="text"
                  value={formData.vendedorAsignado}
                  onChange={(e) => setFormData({ ...formData, vendedorAsignado: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Días para Pagar</label>
                  <input
                    type="number"
                    value={formData.plazoCuentaCorriente}
                    onChange={(e) => setFormData({ ...formData, plazoCuentaCorriente: e.target.value })}
                    placeholder="Ej: 30"
                    min="0"
                    step="1"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>

                <div className="form-group">
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="1"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>
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

      {showModalEditar && (
        <div className="modal-overlay" onClick={handleCerrarModalEditar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Proveedor</h2>
              <button className="modal-close" onClick={handleCerrarModalEditar}>×</button>
            </div>
            <form onSubmit={handleActualizarProveedor} className="modal-body">
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
                <label>Vendedor Asignado</label>
                <input
                  type="text"
                  value={formData.vendedorAsignado}
                  onChange={(e) => setFormData({ ...formData, vendedorAsignado: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Días para Pagar</label>
                  <input
                    type="number"
                    value={formData.plazoCuentaCorriente}
                    onChange={(e) => setFormData({ ...formData, plazoCuentaCorriente: e.target.value })}
                    placeholder="Ej: 30"
                    min="0"
                    step="1"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>

                <div className="form-group">
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="1"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  {' '}Activo
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCerrarModalEditar}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar Proveedor'}
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
                                      setMontoPagoFactura(factura.saldoPendiente.toString());
                                      setPagarTotal(true);
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

      {/* Modal de Cargar Factura */}
      {showModalFactura && (
        <div className="modal-overlay" onClick={() => { setShowModalFactura(false); resetFormFactura(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Cargar Factura</h2>
              <button className="modal-close" onClick={() => { setShowModalFactura(false); resetFormFactura(); }}>×</button>
            </div>
            <form onSubmit={handleCargarFactura} className="modal-body">
              {!proveedorParaFactura && (
                <div className="form-group">
                  <label>Proveedor *</label>
                  <select
                    value=""
                    onChange={(e) => {
                      const proveedor = proveedores.find(p => p.id === e.target.value);
                      setProveedorParaFactura(proveedor || null);
                      if (proveedor) {
                        const diasParaPagar = proveedor.plazoCuentaCorriente?.toString() || '';
                        const descuento = proveedor.descuento?.toString() || '0';
                        const fechaBase = formDataFactura.fecha || format(new Date(), 'yyyy-MM-dd');
                        setFormDataFactura({
                          ...formDataFactura,
                          descuento: descuento,
                          diasParaPagar: diasParaPagar,
                          fechaVencimiento: diasParaPagar 
                            ? calcularFechaVencimiento(diasParaPagar, fechaBase)
                            : '',
                        });
                      }
                    }}
                    required
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {proveedorParaFactura && (
                <div className="proveedor-info-card">
                  <h3>{proveedorParaFactura.nombre}</h3>
                  <p><strong>Plazo Cuenta Corriente:</strong> {(proveedorParaFactura as any).plazoCuentaCorriente || 'N/A'} días</p>
                  <p><strong>Descuento:</strong> {(proveedorParaFactura as any).descuento || 0}%</p>
                </div>
              )}

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
                  <label>Fecha de Recepción *</label>
                  <input
                    type="date"
                    value={formDataFactura.fecha}
                    onChange={(e) => {
                      const nuevaFecha = e.target.value;
                      setFormDataFactura({
                        ...formDataFactura,
                        fecha: nuevaFecha,
                        fechaVencimiento: formDataFactura.diasParaPagar 
                          ? calcularFechaVencimiento(formDataFactura.diasParaPagar)
                          : '',
                      });
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Días para Pagar</label>
                  <input
                    type="number"
                    value={formDataFactura.diasParaPagar}
                    readOnly
                    placeholder="Ej: 30"
                    min="0"
                    step="1"
                    className="input-readonly"
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

              <div className="form-row">
                <div className="form-group">
                  <label>Importe Bruto *</label>
                  <input
                    type="number"
                    value={formDataFactura.importeBruto}
                    onChange={(e) => setFormDataFactura({ ...formDataFactura, importeBruto: e.target.value })}
                    required
                    placeholder="0"
                    min="0"
                    step="1"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>

                <div className="form-group">
                  <label>Descuento (%)</label>
                  <input
                    type="number"
                    value={formDataFactura.descuento}
                    readOnly
                    placeholder="0"
                    min="0"
                    max="100"
                    step="1"
                    className="input-readonly"
                  />
                </div>
              </div>

              {formDataFactura.importeBruto && (
                <div className="factura-resumen">
                  <div className="resumen-item">
                    <span className="resumen-label">Importe Bruto:</span>
                    <span className="resumen-value">{formatearMonto(parseFloat(formDataFactura.importeBruto) || 0)}</span>
                  </div>
                  {parseFloat(formDataFactura.descuento) > 0 && (
                    <div className="resumen-item">
                      <span className="resumen-label">Descuento ({formDataFactura.descuento}%):</span>
                      <span className="resumen-value descuento">-{formatearMonto((parseFloat(formDataFactura.importeBruto) || 0) * parseFloat(formDataFactura.descuento) / 100)}</span>
                    </div>
                  )}
                  <div className="resumen-item">
                    <span className="resumen-label">Saldo Neto a Pagar:</span>
                    <span className="resumen-value total">
                      {formatearMonto(
                        (parseFloat(formDataFactura.importeBruto) || 0) * 
                        (1 - (parseFloat(formDataFactura.descuento) || 0) / 100)
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={formDataFactura.observaciones}
                  onChange={(e) => setFormDataFactura({ ...formDataFactura, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModalFactura(false); resetFormFactura(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading || !proveedorParaFactura}>
                  {loading ? 'Cargando...' : 'Cargar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Facturas del Proveedor */}
      {showModalFacturas && proveedorSeleccionado && (
        <div className="modal-overlay" onClick={() => { setShowModalFacturas(false); setProveedorSeleccionado(null); setFacturas([]); }}>
          <div className="modal-content modal-facturas" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Facturas - {proveedorSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={() => { setShowModalFacturas(false); setProveedorSeleccionado(null); setFacturas([]); }}>×</button>
            </div>
            <div className="modal-body">
              {facturas.length === 0 ? (
                <div className="empty-state">
                  <p>No hay facturas registradas para este proveedor</p>
                </div>
              ) : (
                <div className="facturas-grid">
                  {facturas.map((factura) => (
                    <div
                      key={factura.id}
                      className="factura-card"
                      onClick={async () => {
                        try {
                          const response = await proveedoresApi.obtenerFacturaPorId(factura.id);
                          console.log('Factura recibida:', response.data);
                          console.log('Historial de pagos:', response.data.historialPagos);
                          setDetalleFactura(response.data);
                          setFacturaSeleccionada(response.data);
                          setShowModalDetalleFactura(true);
                        } catch (err: any) {
                          setError(err.message || 'Error al cargar factura');
                        }
                      }}
                    >
                      <div className="factura-header">
                        <h4>Factura {factura.numero}</h4>
                        <span className={`badge ${factura.pagada ? 'pagada' : 'pendiente'}`}>
                          {factura.pagada ? 'Pagada' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="factura-body">
                        <p><strong>Fecha:</strong> {format(new Date(factura.fecha), 'dd/MM/yyyy')}</p>
                        <p><strong>Vencimiento:</strong> {format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy')}</p>
                        <p><strong>Total:</strong> {formatearMonto(factura.total || 0)}</p>
                        {!factura.pagada && (
                          <p><strong>Saldo Pendiente:</strong> {formatearMonto(factura.saldoPendiente || 0)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowModalFacturas(false); setProveedorSeleccionado(null); setFacturas([]); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Factura */}
      {showModalDetalleFactura && detalleFactura && (
        <div className="modal-overlay" onClick={() => { setShowModalDetalleFactura(false); setDetalleFactura(null); }}>
          <div className="modal-content modal-detalle-factura" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Factura {detalleFactura.numero}</h2>
              <button className="modal-close" onClick={() => { setShowModalDetalleFactura(false); setDetalleFactura(null); }}>×</button>
            </div>
            <div className="modal-body">
              {/* Tabla Principal de Datos de la Factura */}
              <div className="factura-tabla-principal">
                <table className="tabla-factura-principal">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Fecha de Recepción</th>
                      <th>Fecha de Vencimiento</th>
                      <th>Importe</th>
                      <th>Descuento</th>
                      <th>Saldo Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{detalleFactura.numero}</strong></td>
                      <td>{format(new Date(detalleFactura.fecha), 'dd/MM/yyyy')}</td>
                      <td>{format(new Date(detalleFactura.fechaVencimiento), 'dd/MM/yyyy')}</td>
                      <td>{formatearMonto(detalleFactura.totalBruto || detalleFactura.total || 0)}</td>
                      <td>
                        {detalleFactura.descuentoTotal > 0 ? (
                          <>
                            {((detalleFactura.descuentoTotal / (detalleFactura.totalBruto || detalleFactura.total || 1)) * 100).toFixed(0)}%
                            <br />
                            <small style={{ color: '#ef4444', fontWeight: 600 }}>
                              -{formatearMonto(detalleFactura.descuentoTotal || 0)}
                            </small>
                          </>
                        ) : (
                          '0%'
                        )}
                      </td>
                      <td><strong style={{ color: '#b91c1c', fontSize: '16px' }}>{formatearMonto(detalleFactura.saldoPendiente || 0)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Resumen Adicional */}
              <div className="factura-resumen-adicional">
                <div className="resumen-card">
                  <div className="resumen-card-label">Total Factura</div>
                  <div className="resumen-card-value">{formatearMonto(detalleFactura.total || 0)}</div>
                </div>
                <div className="resumen-card">
                  <div className="resumen-card-label">Monto Pagado</div>
                  <div className="resumen-card-value">{formatearMonto(detalleFactura.montoPagado || 0)}</div>
                </div>
                <div className="resumen-card destacado">
                  <div className="resumen-card-label">Saldo Pendiente</div>
                  <div className="resumen-card-value pendiente">{formatearMonto(detalleFactura.saldoPendiente || 0)}</div>
                </div>
                <div className="resumen-card">
                  <div className="resumen-card-label">Estado</div>
                  <div>
                    <span className={`badge ${detalleFactura.pagada ? 'pagada' : 'pendiente'}`}>
                      {detalleFactura.pagada ? 'Pagada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Pagos */}
              <div className="historial-pagos">
                <h3>📋 Historial de Pagos</h3>
                {detalleFactura.historialPagos && Array.isArray(detalleFactura.historialPagos) && detalleFactura.historialPagos.length > 0 ? (
                  <table className="tabla-historial-pagos">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Descripción</th>
                        <th>Saldo Anterior</th>
                        <th>Saldo Después</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleFactura.historialPagos.map((pago: any) => (
                        <tr key={pago.id}>
                          <td>{format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm')}</td>
                          <td>
                            <span className={`badge-tipo-pago ${pago.tipo === 'PAGO_COMPLETO' ? 'completo' : 'parcial'}`}>
                              {pago.tipo === 'PAGO_COMPLETO' ? 'Pago Completo' : 'Pago Parcial'}
                            </span>
                          </td>
                          <td><strong style={{ color: '#10b981', fontSize: '16px' }}>{formatearMonto(pago.monto)}</strong></td>
                          <td>{pago.descripcion}</td>
                          <td>{formatearMonto(pago.saldoAnterior)}</td>
                          <td><strong>{formatearMonto(pago.saldoDespues)}</strong></td>
                          <td>{pago.observaciones || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="historial-pagos-vacio">
                    <p>No hay pagos registrados para esta factura</p>
                  </div>
                )}
              </div>

              {!detalleFactura.pagada && (
                <div className="factura-acciones">
                  <button
                    className="btn-primary btn-pagar-factura"
                    onClick={() => {
                      setMontoPagoFactura(detalleFactura.saldoPendiente.toString());
                      setPagarTotal(true);
                      setShowModalPago(true);
                    }}
                  >
                    💰 Pagar Factura
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowModalDetalleFactura(false); setDetalleFactura(null); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showModalPago && facturaSeleccionada && (
        <div className="modal-overlay modal-overlay-inner" onClick={() => { setShowModalPago(false); setMontoPagoFactura(''); setPagarTotal(true); }}>
          <div className="modal-content modal-content-inner" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-pago-header">
              <div className="modal-icon">💰</div>
              <div>
                <h2>Registrar Pago</h2>
                <p className="modal-subtitle">Factura {facturaSeleccionada.numero}</p>
              </div>
              <button className="modal-close" onClick={() => { setShowModalPago(false); setMontoPagoFactura(''); setPagarTotal(true); }}>×</button>
            </div>
            <form onSubmit={handleRegistrarPago} className="modal-body">
              <div className="pago-saldo-card">
                <div className="pago-saldo-label">Saldo Pendiente</div>
                <div className="pago-saldo-monto">{formatearMonto(facturaSeleccionada.saldoPendiente || 0)}</div>
              </div>

              <div className="pago-opciones">
                <div 
                  className={`pago-opcion-card ${pagarTotal ? 'selected' : ''}`}
                  onClick={() => {
                    setPagarTotal(true);
                    setMontoPagoFactura(facturaSeleccionada.saldoPendiente.toString());
                  }}
                >
                  <input
                    type="radio"
                    name="tipoPago"
                    checked={pagarTotal}
                    onChange={() => {
                      setPagarTotal(true);
                      setMontoPagoFactura(facturaSeleccionada.saldoPendiente.toString());
                    }}
                    className="pago-opcion-radio"
                  />
                  <div className="radio-custom"></div>
                  <div className="pago-opcion-content">
                    <div className="pago-opcion-title">Pagar Total</div>
                    <div className="pago-opcion-desc">Cancelar la deuda completa</div>
                  </div>
                  {pagarTotal && <div className="pago-opcion-check">✓</div>}
                </div>

                <div 
                  className={`pago-opcion-card ${!pagarTotal ? 'selected' : ''}`}
                  onClick={() => {
                    setPagarTotal(false);
                    if (!montoPagoFactura) {
                      setMontoPagoFactura('0');
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="tipoPago"
                    checked={!pagarTotal}
                    onChange={() => {
                      setPagarTotal(false);
                      if (!montoPagoFactura) {
                        setMontoPagoFactura('0');
                      }
                    }}
                    className="pago-opcion-radio"
                  />
                  <div className="radio-custom"></div>
                  <div className="pago-opcion-content">
                    <div className="pago-opcion-title">Pagar Monto Parcial</div>
                    <div className="pago-opcion-desc">Realizar un adelanto o entrega parcial</div>
                  </div>
                  {!pagarTotal && <div className="pago-opcion-check">✓</div>}
                </div>
              </div>

              {!pagarTotal && (
                <div className="pago-monto-parcial">
                  <label>Monto a Pagar *</label>
                  <div className="input-with-icon">
                    <span className="input-icon">$</span>
                    <input
                      type="number"
                      value={montoPagoFactura}
                      onChange={(e) => {
                        setMontoPagoFactura(e.target.value);
                      }}
                      placeholder="0"
                      min="0"
                      step="1"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      required
                      className="input-monto"
                      autoFocus
                    />
                  </div>
                  <small>Máximo: {formatearMonto(facturaSeleccionada.saldoPendiente || 0)}</small>
                </div>
              )}

              {!pagarTotal && montoPagoFactura && parseFloat(montoPagoFactura) > 0 && (
                <div className="pago-saldo-restante">
                  <div className="saldo-restante-label">Saldo restante después del pago:</div>
                  <div className="saldo-restante-monto">
                    {formatearMonto(Math.max(0, (facturaSeleccionada.saldoPendiente || 0) - parseFloat(montoPagoFactura || '0')))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setShowModalPago(false); setMontoPagoFactura(''); setPagarTotal(true); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-confirmar" disabled={loading || (!pagarTotal && (!montoPagoFactura || parseFloat(montoPagoFactura) <= 0))}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Procesando...
                    </>
                  ) : (
                    `Confirmar Pago ${pagarTotal ? 'Total' : 'Parcial'}`
                  )}
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

