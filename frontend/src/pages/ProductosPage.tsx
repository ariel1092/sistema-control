import { useState } from 'react';
import { productosApi } from '../services/api';
import './ProductosPage.css';

function ProductosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 0,
    unidadMedida: 'UN',
    descripcion: '',
    marca: '',
    precioCosto: 0,
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const crearProducto = async () => {
    if (!formData.codigo || !formData.nombre || !formData.categoria) {
      setError('Código, nombre y categoría son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await productosApi.crear(formData);
      setSuccess('Producto creado exitosamente');
      setFormData({
        codigo: '',
        nombre: '',
        categoria: '',
        precioVenta: 0,
        stockActual: 0,
        stockMinimo: 0,
        unidadMedida: 'UN',
        descripcion: '',
        marca: '',
        precioCosto: 0,
        activo: true,
      });
      setMostrarFormulario(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Productos</h2>
          <button
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? 'Cancelar' : 'Nuevo Producto'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {mostrarFormulario && (
        <div className="card">
          <h3>Crear Nuevo Producto</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Código *</label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoría *</label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio de Venta *</label>
              <input
                type="number"
                name="precioVenta"
                value={formData.precioVenta}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Precio de Costo</label>
              <input
                type="number"
                name="precioCosto"
                value={formData.precioCosto}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock Actual *</label>
              <input
                type="number"
                name="stockActual"
                value={formData.stockActual}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Stock Mínimo *</label>
              <input
                type="number"
                name="stockMinimo"
                value={formData.stockMinimo}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Unidad de Medida *</label>
              <select
                name="unidadMedida"
                value={formData.unidadMedida}
                onChange={handleInputChange}
                required
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
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
              />
              {' '}Producto Activo
            </label>
          </div>

          <div className="mt-20">
            <button className="btn btn-success" onClick={crearProducto} disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="alert alert-info">
          💡 Usa la página de Ventas para buscar productos. Los productos creados aquí aparecerán en la búsqueda.
        </div>
      </div>
    </div>
  );
}

export default ProductosPage;





