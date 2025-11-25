import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error desconocido';
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// Ventas
export const ventasApi = {
  crear: (data: any) => api.post('/ventas', data),
  obtenerDia: (fecha?: string) => api.get('/ventas/dia', { params: { fecha } }),
  obtenerRecientes: (fecha?: string, tipoMetodoPago?: string) => 
    api.get('/ventas/recientes', { params: { fecha, tipoMetodoPago } }),
  cancelar: (id: string, motivo?: string) => api.patch(`/ventas/${id}/cancelar`, { motivo }),
  obtenerTransferencias: (cuentaBancaria: string, fechaInicio?: string, fechaFin?: string) =>
    api.get(`/ventas/transferencias/${cuentaBancaria}`, { params: { fechaInicio, fechaFin } }),
};

// Productos
export const productosApi = {
  crear: (data: any) => api.post('/productos', data),
  buscar: (termino: string) => api.get('/productos/search', { params: { q: termino } }),
  obtenerPorCodigo: (codigo: string) => api.get(`/productos/codigo/${codigo}`),
  obtenerPorId: (id: string) => api.get(`/productos/${id}`),
  actualizarPrecio: (id: string, precioVenta: number) =>
    api.patch(`/productos/${id}/precio`, { precioVenta }),
  actualizarStock: (id: string, stockActual: number) =>
    api.patch(`/productos/${id}/stock`, { stockActual }),
};

// Caja
export const cajaApi = {
  obtenerResumen: (fecha?: string) => api.get('/caja/resumen', { params: { fecha } }),
  obtenerHistorial: (desde: string, hasta: string) =>
    api.get('/caja/historial', { params: { desde, hasta } }),
  abrir: (data: any) => api.post('/caja/abrir', data),
  cerrar: (data: any) => api.post('/caja/cerrar', data),
};

// Clientes
export const clientesApi = {
  crear: (data: any) => api.post('/clientes', data),
  obtenerTodos: () => api.get('/clientes'),
  buscar: (termino: string) => api.get('/clientes/search', { params: { q: termino } }),
  obtenerPorId: (id: string) => api.get(`/clientes/${id}`),
  actualizar: (id: string, data: any) => api.put(`/clientes/${id}`, data),
  eliminar: (id: string) => api.delete(`/clientes/${id}`),
};

// Empleados
export const empleadosApi = {
  crear: (data: any) => api.post('/empleados', data),
  obtenerTodos: (activos?: boolean) => api.get('/empleados', { params: activos !== undefined ? { activos } : {} }),
  obtenerPorId: (id: string) => api.get(`/empleados/${id}`),
  actualizar: (id: string, data: any) => api.put(`/empleados/${id}`, data),
  registrarPago: (id: string, data: any) => api.post(`/empleados/${id}/pagos`, data),
  registrarAdelanto: (id: string, data: any) => api.post(`/empleados/${id}/adelantos`, data),
  registrarAsistencia: (id: string, data: any) => api.post(`/empleados/${id}/asistencias`, data),
  agregarDocumento: (id: string, data: any) => api.post(`/empleados/${id}/documentos`, data),
  activar: (id: string) => api.patch(`/empleados/${id}/activar`),
  desactivar: (id: string) => api.patch(`/empleados/${id}/desactivar`),
};

// Gastos Diarios
export const gastosApi = {
  crear: (data: any) => api.post('/gastos-diarios', data),
  obtenerTodos: (fechaInicio?: string, fechaFin?: string, categoria?: string) =>
    api.get('/gastos-diarios', { params: { fechaInicio, fechaFin, categoria } }),
  obtenerResumen: (fechaInicio: string, fechaFin: string) =>
    api.get('/gastos-diarios/resumen', { params: { fechaInicio, fechaFin } }),
  eliminar: (id: string) => api.delete(`/gastos-diarios/${id}`),
};

// Retiros Socios
export const retirosApi = {
  crear: (data: any) => api.post('/retiros-socios', data),
  obtenerTodos: (cuentaBancaria?: string, fechaInicio?: string, fechaFin?: string) =>
    api.get('/retiros-socios', { params: { cuentaBancaria, fechaInicio, fechaFin } }),
  eliminar: (id: string) => api.delete(`/retiros-socios/${id}`),
};

// Reportes
export const reportesApi = {
  financiero: (fechaInicio?: string, fechaFin?: string) =>
    api.get('/reportes/financiero', { params: { fechaInicio, fechaFin } }),
  socios: (fechaInicio?: string, fechaFin?: string) =>
    api.get('/reportes/socios', { params: { fechaInicio, fechaFin } }),
  gastosAvanzado: (fechaInicio?: string, fechaFin?: string) =>
    api.get('/reportes/gastos-avanzado', { params: { fechaInicio, fechaFin } }),
};

// Proveedores
export const proveedoresApi = {
  crear: (data: any) => api.post('/proveedores', data),
  obtenerTodos: (activo?: boolean) => api.get('/proveedores', { params: activo !== undefined ? { activo } : {} }),
  obtenerPorId: (id: string) => api.get(`/proveedores/${id}`),
  actualizar: (id: string, data: any) => api.put(`/proveedores/${id}`, data),
  eliminar: (id: string) => api.delete(`/proveedores/${id}`),
  obtenerCuentaCorriente: (id: string) => api.get(`/proveedores/${id}/cuenta-corriente`),
  crearOrdenCompra: (id: string, data: any) => api.post(`/proveedores/${id}/ordenes-compra`, data),
  crearFactura: (data: any) => api.post('/proveedores/facturas', data),
  registrarPago: (facturaId: string, data: any) => api.post(`/proveedores/facturas/${facturaId}/pago`, data),
};

export default api;


