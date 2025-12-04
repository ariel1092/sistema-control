import { useState, useEffect, useCallback, useMemo } from 'react';
import { productosApi } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import './ProductosPage.css';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  descripcion?: string;
  marca?: string;
  precioCosto?: number;
  codigoBarras?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
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
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroStock, setFiltroStock] = useState<string>('todos');
  const [vista, setVista] = useState<'lista' | 'alertas' | 'movimientos'>('lista');

  // Estados para modales
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarIngresarStock, setMostrarIngresarStock] = useState(false);
  const [mostrarDescontarStock, setMostrarDescontarStock] = useState(false);
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Estados para formularios
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    precioVenta: '',
    stockActual: '',
    stockMinimo: '',
    unidadMedida: 'UN',
    descripcion: '',
    marca: '',
    precioCosto: '',
    codigoBarras: '',
    activo: true,
  });

  const [stockData, setStockData] = useState({
    cantidad: '',
    descripcion: '',
    motivo: '',
  });

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productosApi.obtenerTodos();
      setProductos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
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
    if (vista === 'movimientos') {
      cargarMovimientos();
    }
  }, [cargarProductos, vista, cargarMovimientos]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria));
    return Array.from(cats).sort();
  }, [productos]);

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    let filtrados = productos;

    // Filtro de búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        p =>
          p.nombre.toLowerCase().includes(termino) ||
          p.codigo.toLowerCase().includes(termino) ||
          p.descripcion?.toLowerCase().includes(termino) ||
          p.marca?.toLowerCase().includes(termino)
      );
    }

    // Filtro de categoría
    if (filtroCategoria !== 'todas') {
      filtrados = filtrados.filter(p => p.categoria === filtroCategoria);
    }

    // Filtro de stock
    if (filtroStock === 'sinStock') {
      filtrados = filtrados.filter(p => p.stockActual === 0);
    } else if (filtroStock === 'stockBajo') {
      filtrados = filtrados.filter(p => p.stockActual > 0 && p.stockActual <= p.stockMinimo);
    }

    return filtrados;
  }, [productos, busqueda, filtroCategoria, filtroStock]);

  // Obtener alertas
  const alertas = useMemo(() => {
    const sinStock = productos.filter(p => p.stockActual === 0 && p.activo);
    const stockBajo = productos.filter(
      p => p.stockActual > 0 && p.stockActual <= p.stockMinimo && p.activo
    );
    return { sinStock, stockBajo };
  }, [productos]);

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(monto);
  };

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
        stockActual: parseFloat(formData.stockActual.toString()) || 0,
        stockMinimo: parseFloat(formData.stockMinimo.toString()) || 0,
        codigoBarras: formData.codigoBarras || undefined,
      };
      await productosApi.crear(productoData);
      setSuccess('Producto creado exitosamente');
      setMostrarCrear(false);
      setFormData({
        codigo: '',
        nombre: '',
        categoria: '',
        precioVenta: '',
        stockActual: '',
        stockMinimo: '',
        unidadMedida: 'UN',
        descripcion: '',
        marca: '',
        precioCosto: '',
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
      precioVenta: producto.precioVenta.toString(),
      stockActual: producto.stockActual.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      unidadMedida: producto.unidadMedida,
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      precioCosto: producto.precioCosto?.toString() || '',
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
      precioVenta: producto.precioVenta.toString(),
      stockActual: producto.stockActual.toString(),
      stockMinimo: producto.stockMinimo.toString(),
      unidadMedida: producto.unidadMedida,
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      precioCosto: producto.precioCosto?.toString() || '',
      codigoBarras: producto.codigoBarras || '',
      activo: producto.activo,
    });
    setMostrarEditar(true);
  };

  return (
    <div className="productos-page">
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
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="select-filtro"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
            <button
              className="btn btn-primary"
              onClick={() => setMostrarCrear(true)}
            >
              ➕ Nuevo Producto
            </button>
          </div>

          {/* Tabla de productos */}
          {loading && productos.length === 0 ? (
            <div className="loading-container">Cargando productos...</div>
          ) : productosFiltrados.length > 0 ? (
            <div className="table-responsive">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => {
                    const estado = getEstadoStock(producto);
                    return (
                      <tr key={producto.id} className={!producto.activo ? 'inactivo' : ''}>
                        <td>{producto.codigo}</td>
                        <td>
                          <div className="producto-nombre">
                            <strong>{producto.nombre}</strong>
                            {producto.marca && <span className="producto-marca">{producto.marca}</span>}
                          </div>
                        </td>
                        <td>{producto.categoria}</td>
                        <td>{formatearMonto(producto.precioVenta)}</td>
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
            </div>
          ) : (
            <div className="alert alert-info">
              {busqueda || filtroCategoria !== 'todas' || filtroStock !== 'todos'
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
            <div className="loading-container">Cargando movimientos...</div>
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
                  <label className="form-label-required">Nombre *</label>
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
                  <label className="form-label-required">Categoría *</label>
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
                  <label className="form-label-required">Precio de Venta *</label>
                  <input
                    type="number"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Precio de Costo</label>
                  <input
                    type="number"
                    value={formData.precioCosto}
                    onChange={(e) => setFormData({ ...formData, precioCosto: e.target.value })}
                    placeholder="0"
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
                  <label className="form-label-required">Nombre *</label>
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
                  <label className="form-label-required">Precio de Venta *</label>
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
                  <span className="info-label">Precio de Venta:</span>
                  <span className="info-value">{formatearMonto(productoSeleccionado.precioVenta)}</span>
                </div>
                {productoSeleccionado.precioCosto && (
                  <div className="info-row">
                    <span className="info-label">Precio de Costo:</span>
                    <span className="info-value">{formatearMonto(productoSeleccionado.precioCosto)}</span>
                  </div>
                )}
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
    </div>
  );
}

export default ProductosPage;
