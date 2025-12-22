import { useState, useEffect, useCallback, useMemo } from 'react';
import { productosApi, proveedoresApi } from '../services/api';
import { format } from 'date-fns';
import { formatearMoneda } from '../utils/formatters';
import { useGlobalLoading } from '../context/LoadingContext';
import Loading from '../components/common/Loading';
import StatusModal from '../components/common/StatusModal';
import ProductoComparacionProveedores from '../components/ProductoComparacionProveedores';
import './ProductosPage.css';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  proveedorId?: string;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  descripcion?: string;
  marca?: string;
  precioCosto?: number;
  descuento: number;
  iva: number;
  codigoBarras?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Proveedor {
  id: string;
  nombre: string;
  descuento?: number;
}

interface MovimientoStock {
  id: string;
  productoId: string;
  tipo: 'INGRESO' | 'SALIDA' | 'VENTA' | 'AJUSTE' | 'VENTA_CANCELADA';
  cantidad: number;
  descripcion: string;
  usuarioId: string;
  ventaId?: string;
  createdAt: string;
}

function ProductosPage() {
  const { showLoading, hideLoading } = useGlobalLoading();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Estado para la alerta profesional
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos');
  const [filtroStock, setFiltroStock] = useState<string>('todos');
  const [vista, setVista] = useState<'lista' | 'alertas' | 'movimientos'>('lista');

  // Estados para modales
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarIngresarStock, setMostrarIngresarStock] = useState(false);
  const [mostrarDescontarStock, setMostrarDescontarStock] = useState(false);
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarImportarExcel, setMostrarImportarExcel] = useState(false);

  // Estados para formularios
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'General',
    proveedorId: '',
    precioVenta: '',
    stockActual: '',
    stockMinimo: '',
    unidadMedida: 'UN',
    descripcion: '',
    marca: '',
    precioCosto: '',
    descuento: '0',
    iva: '21',
    margenGanancia: '100',
    codigoBarras: '',
    activo: true,
  });

  const [importarData, setImportarData] = useState({
    proveedorId: '',
    file: null as File | null
  });

  const [stockData, setStockData] = useState({
    cantidad: '',
    descripcion: '',
    motivo: '',
  });

  // Estados para paginación
  const [totalProductos, setTotalProductos] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina] = useState(50);
  const [busquedaDebounced, setBusquedaDebounced] = useState('');

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPaginaActual(1); // Reset a primera página al buscar
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cargar productos con paginación y búsqueda
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productosApi.obtenerTodos({
        q: busquedaDebounced,
        page: paginaActual,
        limit: limitePorPagina,
        // Por defecto listamos activos; el filtro "Sin Stock / Stock Bajo" se resuelve local con `alertas`
        activos: true,
      });

      const { data, total } = response.data;
      setProductos(data);
      setTotalProductos(total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [busquedaDebounced, paginaActual, limitePorPagina]);

  const cargarProveedores = useCallback(async () => {
    try {
      const response = await proveedoresApi.obtenerTodos();
      setProveedores(response.data || []);
    } catch (err) {
      console.error("Error al cargar proveedores", err);
    }
  }, []);

  // Cargar movimientos
  const cargarMovimientos = useCallback(async (productoId?: string) => {
    try {
      setLoading(true);
      const response = await productosApi.obtenerMovimientos(productoId);
      setMovimientos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarProveedores();
    if (vista === 'movimientos') {
      cargarMovimientos();
    }
  }, [cargarProductos, cargarProveedores, vista, cargarMovimientos]);

  // Estados para alertas
  const [alertas, setAlertas] = useState<{ sinStock: Producto[], stockBajo: Producto[] }>({ sinStock: [], stockBajo: [] });

  const cargarAlertas = useCallback(async () => {
    try {
      const response = await productosApi.obtenerAlertas();
      setAlertas(response.data);
    } catch (err) {
      console.error("Error al cargar alertas", err);
    }
  }, []);

  useEffect(() => {
    cargarAlertas();
  }, [cargarAlertas]);

  // Filtrado: búsqueda (server-side) + proveedor (local) + stock (usa alertas)
  const productosFiltrados = useMemo(() => {
    // Stock: si el usuario selecciona "Sin Stock" o "Stock Bajo", usamos el set de alertas (ya viene de backend)
    // para que el filtro sea confiable y no dependa de paginación.
    let base: Producto[] = productos;
    if (filtroStock === 'sinStock') {
      base = alertas.sinStock;
    } else if (filtroStock === 'stockBajo') {
      base = alertas.stockBajo;
    }

    // Si estamos usando alertas como fuente (sinStock/stockBajo), la búsqueda debe aplicarse localmente
    // porque esos datos no pasan por el search/paginación.
    let filtrados = base;
    if (filtroStock !== 'todos' && busquedaDebounced.trim() !== '') {
      const q = busquedaDebounced.trim().toLowerCase();
      filtrados = filtrados.filter((p) => {
        const codigo = (p.codigo || '').toLowerCase();
        const nombre = (p.nombre || '').toLowerCase();
        const marca = (p.marca || '').toLowerCase();
        return codigo.includes(q) || nombre.includes(q) || marca.includes(q);
      });
    }

    if (filtroProveedor !== 'todos') {
      filtrados = filtrados.filter(p => p.proveedorId === filtroProveedor);
    }
    return filtrados;
  }, [productos, alertas, filtroStock, filtroProveedor, busquedaDebounced]);

  const getEstadoStock = (producto: Producto) => {
    if (producto.stockActual === 0) return { texto: 'Sin Stock', clase: 'sin-stock' };
    if (producto.stockActual <= producto.stockMinimo) return { texto: 'Stock Bajo', clase: 'stock-bajo' };
    return { texto: 'OK', clase: 'stock-ok' };
  };

  const handleCrearProducto = async () => {
    try {
      setLoading(true);
      setError(null);
      const productoData = {
        ...formData,
        precioVenta: parseFloat(formData.precioVenta.toString()) || 0,
        precioCosto: formData.precioCosto ? parseFloat(formData.precioCosto.toString()) : undefined,
        descuento: parseFloat(formData.descuento.toString()) || 0,
        iva: parseFloat(formData.iva.toString()) || 21,
        stockActual: parseFloat(formData.stockActual.toString()) || 0,
        stockMinimo: parseFloat(formData.stockMinimo.toString()) || 0,
        codigoBarras: formData.codigoBarras || undefined,
        proveedorId: formData.proveedorId || undefined,
      };
      await productosApi.crear(productoData);
      setSuccess('Producto creado exitosamente');
      setMostrarCrear(false);
      setFormData({
        codigo: '',
        nombre: '',
        categoria: 'General',
        proveedorId: '',
        precioVenta: '',
        stockActual: '',
        stockMinimo: '',
        unidadMedida: 'UN',
        descripcion: '',
        marca: '',
        precioCosto: '',
        descuento: '0',
        iva: '21',
        margenGanancia: '100',
        codigoBarras: '',
        activo: true,
      });
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = async () => {
    if (!productoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      const productoData = {
        ...formData,
        precioVenta: parseFloat(formData.precioVenta.toString()) || 0,
        precioCosto: formData.precioCosto ? parseFloat(formData.precioCosto.toString()) : undefined,
        descuento: parseFloat(formData.descuento.toString()) || 0,
        stockMinimo: parseFloat(formData.stockMinimo.toString()) || 0,
        codigoBarras: formData.codigoBarras || undefined,
      };
      await productosApi.actualizar(productoSeleccionado.id, productoData);
      setSuccess('Producto actualizado exitosamente');
      setMostrarEditar(false);
      setProductoSeleccionado(null);
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarProducto = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      setLoading(true);
      setError(null);
      await productosApi.eliminar(id);
      setSuccess('Producto eliminado exitosamente');
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleIngresarStock = async () => {
    if (!productoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await productosApi.ingresarStock(productoSeleccionado.id, {
        cantidad: parseFloat(stockData.cantidad),
        descripcion: stockData.descripcion,
      });
      setSuccess('Stock ingresado exitosamente');
      setMostrarIngresarStock(false);
      setStockData({ cantidad: '', descripcion: '', motivo: '' });
      cargarProductos();
      cargarAlertas();
      if (mostrarDetalle) {
        cargarMovimientos(productoSeleccionado.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ingresar stock');
    } finally {
      setLoading(false);
    }
  };

  const handleDescontarStock = async () => {
    if (!productoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await productosApi.descontarStock(productoSeleccionado.id, {
        cantidad: parseFloat(stockData.cantidad),
        motivo: stockData.motivo,
      });
      setSuccess('Stock descontado exitosamente');
      setMostrarDescontarStock(false);
      setStockData({ cantidad: '', descripcion: '', motivo: '' });
      cargarProductos();
      cargarAlertas();
      if (mostrarDetalle) {
        cargarMovimientos(productoSeleccionado.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descontar stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAjusteInventario = async () => {
    if (!productoSeleccionado) return;
    try {
      setLoading(true);
      setError(null);
      await productosApi.ajustarInventario(productoSeleccionado.id, {
        cantidad: parseFloat(stockData.cantidad),
        motivo: stockData.motivo,
      });
      setSuccess('Inventario ajustado exitosamente');
      setMostrarAjuste(false);
      setStockData({ cantidad: '', descripcion: '', motivo: '' });
      cargarProductos();
      cargarAlertas();
      if (mostrarDetalle) {
        cargarMovimientos(productoSeleccionado.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al ajustar inventario');
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = async (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      proveedorId: producto.proveedorId || '',
      precioVenta: producto.precioVenta.toString(),
      stockActual: producto.stockActual.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      unidadMedida: producto.unidadMedida,
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      precioCosto: producto.precioCosto?.toString() || '',
      descuento: producto.descuento.toString(),
      iva: producto.iva.toString(),
      margenGanancia: String((producto as any).margenGanancia ?? '100'),
      codigoBarras: producto.codigoBarras || '',
      activo: producto.activo,
    });
    setMostrarDetalle(true);
    await cargarMovimientos(producto.id);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      proveedorId: producto.proveedorId || '',
      precioVenta: producto.precioVenta.toString(),
      stockActual: producto.stockActual.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      unidadMedida: producto.unidadMedida,
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      precioCosto: producto.precioCosto?.toString() || '',
      descuento: producto.descuento.toString(),
      iva: producto.iva.toString(),
      margenGanancia: String((producto as any).margenGanancia ?? '100'),
      codigoBarras: producto.codigoBarras || '',
      activo: producto.activo,
    });
    setMostrarEditar(true);
  };

  return (
    <div className="productos-page">
      <StatusModal 
        show={statusModal.show}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, show: false })}
      />
      {loading && productos.length > 0 && <Loading fullScreen mensaje="Procesando..." />}
      <div className="productos-header">
        <h1 className="page-title">📦 Gestión de Productos y Stock</h1>
        <p className="page-subtitle">Control completo de inventario y movimientos de stock</p>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" onClick={() => setSuccess(null)}>
          {success}
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="productos-tabs">
        <button
          className={`tab ${vista === 'lista' ? 'active' : ''}`}
          onClick={() => setVista('lista')}
        >
          📋 Listado
        </button>
        <button
          className={`tab ${vista === 'alertas' ? 'active' : ''}`}
          onClick={() => setVista('alertas')}
        >
          ⚠️ Alertas ({alertas.sinStock.length + alertas.stockBajo.length})
        </button>
        <button
          className={`tab ${vista === 'movimientos' ? 'active' : ''}`}
          onClick={() => setVista('movimientos')}
        >
          📊 Movimientos
        </button>
      </div>

      {/* Vista Listado */}
      {vista === 'lista' && (
        <div className="productos-content">
          {/* Filtros y búsqueda */}
          <div className="productos-filtros">
            <div className="filtro-group">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, código, marca..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>
            <div className="filtro-group">
              <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                className="select-filtro"
              >
                <option value="todos">Todos los proveedores</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="filtro-group">
              <select
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value)}
                className="select-filtro"
              >
                <option value="todos">Todos</option>
                <option value="sinStock">Sin Stock</option>
                <option value="stockBajo">Stock Bajo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarImportarExcel(true)}
              >
                📤 Importar Excel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setMostrarCrear(true)}
              >
                ➕ Nuevo Producto
              </button>
            </div>
          </div>

          {/* Tabla de productos */}
          {loading && productos.length === 0 ? (
            <Loading mensaje="Cargando productos..." />
          ) : productosFiltrados.length > 0 ? (
            <div className="table-responsive">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>COD</th>
                    <th>ART</th>
                    <th>PL</th>
                    <th>IVA</th>
                    <th>DCTO</th>
                    <th>VENTA</th>
                    <th>Proveedor</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => {
                    const estado = getEstadoStock(producto);
                    
                    // LÓGICA DE FERRETERÍA PROFESIONAL:
                    // 1. PL (Precio Lista)
                    const pl = producto.precioCosto || 0;
                    
                    // 2. IVA (PL + 21%)
                    const precioConIva = pl * 1.21;
                    
                    // 3. DCTO (Precio con IVA - %Descuento del Proveedor)
                    const descuentoPorcentaje = producto.descuento || 0;
                    const precioCostoReal = precioConIva * (1 - descuentoPorcentaje / 100);
                    
                    // 4. VENTA (Costo Real * 1.6 de Margen)
                    const precioVentaFinal = precioCostoReal * 1.6;

                    return (
                      <tr key={producto.id} className={!producto.activo ? 'inactivo' : ''}>
                        <td>{producto.codigo}</td>
                        <td>
                          <div className="producto-nombre">
                            <strong>{producto.nombre}</strong>
                            {producto.marca && <span className="producto-marca">{producto.marca}</span>}
                          </div>
                        </td>
                        <td>{formatearMoneda(pl)}</td>
                        <td>{formatearMoneda(precioConIva)}</td>
                        <td>{formatearMoneda(precioCostoReal)}</td>
                        <td className="col-venta-destacada">
                          <strong>{formatearMoneda(precioVentaFinal)}</strong>
                        </td>
                        <td>{proveedores.find(p => p.id === producto.proveedorId)?.nombre || 'Sin Proveedor'}</td>
                        <td>
                            <div className="stock-info">
                            <span className="stock-cantidad">{producto.stockActual}</span>
                            <span className="stock-unidad">{producto.unidadMedida}</span>
                            <span className="stock-minimo">(mín: {producto.stockMinimo})</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${estado.clase}`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td>
                          <div className="acciones-producto">
                            <button
                              className="btn-icon"
                              onClick={() => abrirDetalle(producto)}
                              title="Ver detalle"
                            >
                              👁️
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => abrirEditar(producto)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            {producto.activo && (
                              <button
                                className="btn-icon btn-danger"
                                onClick={() => handleEliminarProducto(producto.id)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-controls">
                <div className="pagination-info">
                  Mostrando {((paginaActual - 1) * limitePorPagina) + 1} - {Math.min(paginaActual * limitePorPagina, totalProductos)} de {totalProductos} productos
                </div>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={paginaActual === 1 || loading}
                    onClick={() => setPaginaActual(p => p - 1)}
                  >
                    ◀ Anterior
                  </button>
                  <span className="pagination-current">Página {paginaActual} de {Math.ceil(totalProductos / limitePorPagina)}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={paginaActual >= Math.ceil(totalProductos / limitePorPagina) || loading}
                    onClick={() => setPaginaActual(p => p + 1)}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              {busqueda || filtroProveedor !== 'todos' || filtroStock !== 'todos'
                ? 'No se encontraron productos con los filtros aplicados'
                : 'No hay productos registrados. Crea el primero haciendo clic en "Nuevo Producto"'}
            </div>
          )}
        </div>
      )}

      {/* Vista Alertas */}
      {vista === 'alertas' && (
        <div className="productos-content">
          <div className="alertas-container">
            <div className="alerta-section sin-stock-section">
              <h2>🔴 Sin Stock ({alertas.sinStock.length})</h2>
              {alertas.sinStock.length > 0 ? (
                <div className="productos-alerta-list">
                  {alertas.sinStock.map(producto => (
                    <div key={producto.id} className="producto-alerta-item">
                      <div className="producto-alerta-info">
                        <strong>{producto.nombre}</strong>
                        <span className="producto-alerta-codigo">{producto.codigo}</span>
                      </div>
                      <div className="producto-alerta-stock">
                        <span className="stock-cantidad">0</span>
                        <span className="stock-unidad">{producto.unidadMedida}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setProductoSeleccionado(producto);
                          setStockData({ cantidad: '', descripcion: 'Reposición de stock', motivo: '' });
                          setMostrarIngresarStock(true);
                        }}
                      >
                        Ingresar Stock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success">✅ Todos los productos tienen stock</div>
              )}
            </div>

            <div className="alerta-section stock-bajo-section">
              <h2>🟡 Stock Bajo ({alertas.stockBajo.length})</h2>
              {alertas.stockBajo.length > 0 ? (
                <div className="productos-alerta-list">
                  {alertas.stockBajo.map(producto => (
                    <div key={producto.id} className="producto-alerta-item">
                      <div className="producto-alerta-info">
                        <strong>{producto.nombre}</strong>
                        <span className="producto-alerta-codigo">{producto.codigo}</span>
                      </div>
                      <div className="producto-alerta-stock">
                        <span className="stock-cantidad">{producto.stockActual}</span>
                        <span className="stock-unidad">{producto.unidadMedida}</span>
                        <span className="stock-minimo">(mín: {producto.stockMinimo})</span>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setProductoSeleccionado(producto);
                          setStockData({ cantidad: '', descripcion: 'Reposición de stock', motivo: '' });
                          setMostrarIngresarStock(true);
                        }}
                      >
                        Ingresar Stock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success">✅ No hay productos con stock bajo</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista Movimientos */}
      {vista === 'movimientos' && (
        <div className="productos-content">
          {loading && movimientos.length === 0 ? (
            <Loading mensaje="Cargando movimientos..." />
          ) : movimientos.length > 0 ? (
            <div className="table-responsive">
              <table className="movimientos-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{format(new Date(mov.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                      <td>
                        {productos.find(p => p.id === mov.productoId)?.nombre || mov.productoId}
                      </td>
                      <td>
                        <span className={`badge badge-${mov.tipo.toLowerCase()}`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.descripcion}</td>
                      <td>{mov.usuarioId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">No hay movimientos registrados</div>
          )}
        </div>
      )}

      {/* Modal Crear Producto */}
      {mostrarCrear && (
        <div className="modal-overlay" onClick={() => setMostrarCrear(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Crear Nuevo Producto</h2>
              <button className="modal-close" onClick={() => setMostrarCrear(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Código único"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Artículo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Proveedor *</label>
                  <select
                    value={formData.proveedorId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const prov = proveedores.find(p => p.id === pId);
                      setFormData({ 
                        ...formData, 
                        proveedorId: pId,
                        descuento: prov?.descuento?.toString() || '0'
                      });
                    }}
                  >
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ej: Herramientas, Materiales, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Marca del producto"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Precio VENTA *</label>
                  <input
                    type="number"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>PL (Precio Lista)</label>
                  <input
                    type="number"
                    value={formData.precioCosto}
                    onChange={(e) => setFormData({ ...formData, precioCosto: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Descuento (DCTO %)</label>
                  <input
                    type="number"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>IVA (%)</label>
                  <input
                    type="number"
                    value={formData.iva}
                    onChange={(e) => setFormData({ ...formData, iva: e.target.value })}
                    placeholder="21"
                  />
                </div>
                <div className="form-group">
                  <label>Margen de Ganancia (%)</label>
                  <input
                    type="number"
                    value={formData.margenGanancia}
                    onChange={(e) => setFormData({ ...formData, margenGanancia: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Stock Actual *</label>
                  <input
                    type="number"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Stock Mínimo *</label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Unidad de Medida *</label>
                  <select
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                  >
                    <option value="UN">Unidad (UN)</option>
                    <option value="KG">Kilogramo (KG)</option>
                    <option value="M">Metro (M)</option>
                    <option value="L">Litro (L)</option>
                    <option value="M2">Metro Cuadrado (M2)</option>
                    <option value="M3">Metro Cúbico (M3)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Código de Barras</label>
                <input
                  type="text"
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  placeholder="Código de barras (opcional)"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarCrear(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCrearProducto}
                disabled={loading || !formData.codigo || !formData.nombre || !formData.categoria}
              >
                {loading ? 'Guardando...' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Producto */}
      {mostrarEditar && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarEditar(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Producto</h2>
              <button className="modal-close" onClick={() => setMostrarEditar(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Artículo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Categoría *</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label-required">Precio VENTA *</label>
                  <input
                    type="number"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Precio de Costo</label>
                  <input
                    type="number"
                    value={formData.precioCosto}
                    onChange={(e) => setFormData({ ...formData, precioCosto: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Actual (solo lectura)</label>
                  <input
                    type="number"
                    value={formData.stockActual}
                    disabled
                    className="input-disabled"
                  />
                  <small>El stock se modifica mediante movimientos</small>
                </div>
                <div className="form-group">
                  <label className="form-label-required">Stock Mínimo *</label>
                  <input
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-required">Unidad de Medida *</label>
                  <select
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                  >
                    <option value="UN">Unidad (UN)</option>
                    <option value="KG">Kilogramo (KG)</option>
                    <option value="M">Metro (M)</option>
                    <option value="L">Litro (L)</option>
                    <option value="M2">Metro Cuadrado (M2)</option>
                    <option value="M3">Metro Cúbico (M3)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Código de Barras</label>
                <input
                  type="text"
                  value={formData.codigoBarras}
                  onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
                  {' '}Producto Activo
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarEditar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditarProducto}
                disabled={loading || !formData.codigo || !formData.nombre || !formData.categoria}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Producto */}
      {mostrarDetalle && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarDetalle(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 {productoSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={() => setMostrarDetalle(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="producto-detalle-info">
                <div className="info-row">
                  <span className="info-label">Código:</span>
                  <span className="info-value">{productoSeleccionado.codigo}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Categoría:</span>
                  <span className="info-value">{productoSeleccionado.categoria}</span>
                </div>
                {productoSeleccionado.marca && (
                  <div className="info-row">
                    <span className="info-label">Marca:</span>
                    <span className="info-value">{productoSeleccionado.marca}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Precio VENTA:</span>
                  <span className="info-value">{formatearMoneda(productoSeleccionado.precioVenta)}</span>
                </div>
                {productoSeleccionado.precioCosto && (
                  <div className="info-row">
                    <span className="info-label">PL (Precio Lista):</span>
                    <span className="info-value">{formatearMoneda(productoSeleccionado.precioCosto)}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Margen de Ganancia (MG):</span>
                  <span className="info-value">{proveedores.find(p => p.id === productoSeleccionado.proveedorId)?.descuento || 0}% desc. / {(productoSeleccionado as any).margenGanancia || 100}% MG</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stock Actual:</span>
                  <span className={`info-value ${getEstadoStock(productoSeleccionado).clase}`}>
                    {productoSeleccionado.stockActual} {productoSeleccionado.unidadMedida}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stock Mínimo:</span>
                  <span className="info-value">{productoSeleccionado.stockMinimo} {productoSeleccionado.unidadMedida}</span>
                </div>
                {productoSeleccionado.codigoBarras && (
                  <div className="info-row">
                    <span className="info-label">Código de Barras:</span>
                    <span className="info-value">{productoSeleccionado.codigoBarras}</span>
                  </div>
                )}
                {productoSeleccionado.descripcion && (
                  <div className="info-row">
                    <span className="info-label">Descripción:</span>
                    <span className="info-value">{productoSeleccionado.descripcion}</span>
                  </div>
                )}
              </div>

              <ProductoComparacionProveedores productoId={productoSeleccionado.id} />

              <div className="producto-acciones-stock">
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setStockData({ cantidad: '', descripcion: 'Ingreso de stock', motivo: '' });
                    setMostrarIngresarStock(true);
                  }}
                >
                  ➕ Ingresar Stock
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setStockData({ cantidad: '', descripcion: '', motivo: 'Salida de stock' });
                    setMostrarDescontarStock(true);
                  }}
                >
                  ➖ Descontar Stock
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => {
                    setStockData({ cantidad: '', descripcion: '', motivo: 'Ajuste de inventario' });
                    setMostrarAjuste(true);
                  }}
                >
                  🔧 Ajustar Inventario
                </button>
              </div>

              <div className="movimientos-producto">
                <h3>📊 Historial de Movimientos</h3>
                {movimientos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="movimientos-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Cantidad</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((mov) => (
                          <tr key={mov.id}>
                            <td>{format(new Date(mov.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                            <td>
                              <span className={`badge badge-${mov.tipo.toLowerCase()}`}>
                                {mov.tipo}
                              </span>
                            </td>
                            <td>{mov.cantidad}</td>
                            <td>{mov.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">No hay movimientos registrados para este producto</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ingresar Stock */}
      {mostrarIngresarStock && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarIngresarStock(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Ingresar Stock</h2>
              <button className="modal-close" onClick={() => setMostrarIngresarStock(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <div className="info-item">
                  <span className="info-label">Producto:</span>
                  <span className="info-value">{productoSeleccionado.nombre}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Stock Actual:</span>
                  <span className="info-value">{productoSeleccionado.stockActual} {productoSeleccionado.unidadMedida}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label-required">Cantidad *</label>
                <input
                  type="number"
                  value={stockData.cantidad}
                  onChange={(e) => setStockData({ ...stockData, cantidad: e.target.value })}
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label-required">Descripción *</label>
                <input
                  type="text"
                  value={stockData.descripcion}
                  onChange={(e) => setStockData({ ...stockData, descripcion: e.target.value })}
                  placeholder="Ej: Compra a proveedor, Reposición, etc."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarIngresarStock(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={handleIngresarStock}
                disabled={loading || !stockData.cantidad || parseFloat(stockData.cantidad) <= 0 || !stockData.descripcion}
              >
                {loading ? 'Guardando...' : 'Ingresar Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Descontar Stock */}
      {mostrarDescontarStock && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarDescontarStock(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➖ Descontar Stock</h2>
              <button className="modal-close" onClick={() => setMostrarDescontarStock(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <div className="info-item">
                  <span className="info-label">Producto:</span>
                  <span className="info-value">{productoSeleccionado.nombre}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Stock Disponible:</span>
                  <span className="info-value">{productoSeleccionado.stockActual} {productoSeleccionado.unidadMedida}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label-required">Cantidad *</label>
                <input
                  type="number"
                  value={stockData.cantidad}
                  onChange={(e) => setStockData({ ...stockData, cantidad: e.target.value })}
                  placeholder="0"
                  max={productoSeleccionado.stockActual}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label-required">Motivo *</label>
                <input
                  type="text"
                  value={stockData.motivo}
                  onChange={(e) => setStockData({ ...stockData, motivo: e.target.value })}
                  placeholder="Ej: Rotura, Pérdida, Vencimiento, Consumo interno"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarDescontarStock(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-warning"
                onClick={handleDescontarStock}
                disabled={
                  loading ||
                  !stockData.cantidad ||
                  parseFloat(stockData.cantidad) <= 0 ||
                  parseFloat(stockData.cantidad) > productoSeleccionado.stockActual ||
                  !stockData.motivo
                }
              >
                {loading ? 'Guardando...' : 'Descontar Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste Inventario */}
      {mostrarAjuste && productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarAjuste(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔧 Ajustar Inventario</h2>
              <button className="modal-close" onClick={() => setMostrarAjuste(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <div className="info-item">
                  <span className="info-label">Producto:</span>
                  <span className="info-value">{productoSeleccionado.nombre}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Stock Actual:</span>
                  <span className="info-value">{productoSeleccionado.stockActual} {productoSeleccionado.unidadMedida}</span>
                </div>
              </div>
              <div className="alert alert-info">
                💡 Ingrese un valor positivo para sumar o negativo para restar. Ejemplo: +5 para sumar 5 unidades, -3 para restar 3 unidades.
              </div>
              <div className="form-group">
                <label className="form-label-required">Cantidad del Ajuste *</label>
                <input
                  type="number"
                  value={stockData.cantidad}
                  onChange={(e) => setStockData({ ...stockData, cantidad: e.target.value })}
                  placeholder="Ej: +5 o -3"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label-required">Motivo *</label>
                <input
                  type="text"
                  value={stockData.motivo}
                  onChange={(e) => setStockData({ ...stockData, motivo: e.target.value })}
                  placeholder="Ej: Encontré 3 unidades más, El conteo estaba mal"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarAjuste(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-info"
                onClick={handleAjusteInventario}
                disabled={
                  loading ||
                  !stockData.cantidad ||
                  parseFloat(stockData.cantidad) === 0 ||
                  !stockData.motivo ||
                  (parseFloat(stockData.cantidad) < 0 && Math.abs(parseFloat(stockData.cantidad)) > productoSeleccionado.stockActual)
                }
              >
                {loading ? 'Guardando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Importar Excel */}
      {mostrarImportarExcel && (
        <div className="modal-overlay" onClick={() => setMostrarImportarExcel(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Importar Productos desde Excel</h2>
              <button className="modal-close" onClick={() => setMostrarImportarExcel(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                Seleccione el proveedor al que pertenecen los productos del Excel. 
                Se aplicará automáticamente el descuento del proveedor.
              </div>
              <div className="form-group">
                <label className="form-label-required">Proveedor *</label>
                <select
                  value={importarData.proveedorId}
                  onChange={(e) => setImportarData({ ...importarData, proveedorId: e.target.value })}
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.descuento || 0}% desc.)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label-required">Archivo Excel *</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setImportarData({ ...importarData, file: e.target.files ? e.target.files[0] : null })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMostrarImportarExcel(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!importarData.file || !importarData.proveedorId) return;
                  try {
                    setLoading(true);
                    showLoading("Procesando importación de productos... Por favor espere.");
                    const res = await productosApi.importarExcel(importarData.file, importarData.proveedorId);
                    const { procesados, creados, actualizados, errores } = res.data;
                    let msg = `Proceso completado. Procesados: ${procesados}. Creados: ${creados}. Actualizados: ${actualizados}.`;
                    if (errores.length > 0) msg += ` Errores: ${errores.length}`;
                    
                    setStatusModal({
                      show: true,
                      type: 'success',
                      title: 'Importación Finalizada',
                      message: msg
                    });

                    setMostrarImportarExcel(false);
                    setImportarData({ proveedorId: '', file: null });
                    cargarProductos();
                  } catch (err: any) {
                    setError("Error al importar el archivo");
                  } finally {
                    setLoading(false);
                    hideLoading();
                  }
                }}
                disabled={loading || !importarData.file || !importarData.proveedorId}
              >
                {loading ? 'Procesando...' : 'Iniciar Importación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductosPage;
