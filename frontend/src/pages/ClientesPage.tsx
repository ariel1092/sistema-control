import { useState, useEffect } from 'react';
import { clientesApi } from '../services/api';
import './ClientesPage.css';

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
  const [formData, setFormData] = useState({
    nombre: '',
    razonSocial: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: '',
    tieneCuentaCorriente: false,
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
      await clientesApi.crear(formData);
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
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setError(null);
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
                    ${cliente.saldoCuentaCorriente.toFixed(2)}
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
                  Tiene Cuenta Corriente
                </label>
              </div>

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
    </div>
  );
}

export default ClientesPage;











