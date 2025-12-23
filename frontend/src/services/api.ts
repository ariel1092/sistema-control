import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API de Autenticación
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getProfile: () =>
    api.get('/auth/profile'),
};

// API de Caja
export const cajaApi = {
  obtenerResumen: (fecha: string) =>
    api.get(`/caja/resumen?fecha=${fecha}`),
  abrirCaja: (montoInicial: number, usuarioId: string) =>
    api.post(`/caja/abrir?usuarioId=${usuarioId}`, { montoInicial }),
  cerrarCaja: (data: { montoFinal: number; observaciones?: string }, usuarioId: string) =>
    api.post(`/caja/cerrar?usuarioId=${usuarioId}`, data),
  crearMovimiento: (data: { tipo: 'INGRESO' | 'SALIDA'; monto: number; motivo: string }, usuarioId: string) =>
    api.post(`/caja/movimientos?usuarioId=${usuarioId}`, data),
  obtenerHistorial: (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return api.get(`/caja/historial?${params.toString()}`);
  },
};

// API de Ventas
export const ventasApi = {
  obtenerTodas: () =>
    api.get('/ventas'),
  obtenerPorId: (id: string) =>
    api.get(`/ventas/${id}`),
  obtenerPorRango: (fechaInicio: string, fechaFin: string) =>
    api.get(`/ventas/rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
  obtenerRecientes: (fecha: string) =>
    api.get(`/ventas?fecha=${fecha}`),
  obtenerTransferencias: (socio: string, fechaInicio: string, fechaFin: string) =>
    api.get(`/ventas/transferencias?socio=${socio}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
  crear: async (data: any) => {
    const res = await api.post('/ventas', data);
    // Capturar Server-Timing (si CORS lo expone) para correlación con User Timing
    try {
      if (typeof window !== 'undefined') {
        const st = (res.headers as any)?.['server-timing'];
        (window as any).__lastVentaServerTiming = st;
      }
    } catch {
      // no-op
    }
    return res;
  },
  cancelar: (id: string, motivo: string) =>
    api.post(`/ventas/${id}/cancelar`, { motivo }),
};

// API de Productos
export const productosApi = {
  buscar: (termino: string, params?: { limit?: number; page?: number }) =>
    api.get('/productos', { params: { q: termino, ...params } }),
  obtenerTodos: (params?: { q?: string; all?: boolean; activos?: boolean; limit?: number; page?: number }) =>
    api.get(`/productos`, { params: { ...params } }),
  obtenerPorId: (id: string) =>
    api.get(`/productos/${id}`),
  obtenerPreciosProveedores: (productoId: string, config?: any) =>
    api.get(`/productos/${productoId}/precios-proveedores`, config),
  obtenerAlertas: () =>
    api.get('/productos/alertas'),
  obtenerMovimientos: (productoId?: string, tipo?: string, fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (productoId) params.append('productoId', productoId);
    if (tipo) params.append('tipo', tipo);
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return api.get(`/productos/movimientos?${params.toString()}`);
  },
  crear: (data: any) =>
    api.post('/productos', data),
  actualizar: (id: string, data: any) =>
    api.put(`/productos/${id}`, data),
  eliminar: (id: string) =>
    api.delete(`/productos/${id}`),
  ingresarStock: (id: string, data: { cantidad: number; descripcion: string }) =>
    api.post(`/productos/${id}/stock/ingresar`, data),
  descontarStock: (id: string, data: { cantidad: number; motivo: string }) =>
    api.post(`/productos/${id}/stock/descontar`, data),
  ajustarInventario: (id: string, data: { cantidad: number; motivo: string }) =>
    api.post(`/productos/${id}/stock/ajustar`, data),
  importarExcel: (file: File, proveedorId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = proveedorId ? `?proveedorId=${proveedorId}` : '';
    return api.post(`/productos/importar-excel${params}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// API de Clientes
export const clientesApi = {
  obtenerTodos: () =>
    api.get('/clientes'),
  obtenerPorId: (id: string) =>
    api.get(`/clientes/${id}`),
  crear: (data: any) =>
    api.post('/clientes', data),
  actualizar: (id: string, data: any) =>
    api.put(`/clientes/${id}`, data),
  eliminar: (id: string) =>
    api.delete(`/clientes/${id}`),
  obtenerCuentaCorriente: (clienteId: string) =>
    api.get(`/clientes/${clienteId}/cuenta-corriente`),
  obtenerFacturas: (clienteId: string) =>
    api.get(`/clientes/${clienteId}/facturas`),
  cargarFactura: (clienteId: string, data: any) =>
    api.post(`/clientes/${clienteId}/facturas`, data),
  registrarPago: (facturaId: string, data: { monto: number; descripcion?: string; observaciones?: string }) =>
    api.post(`/clientes/facturas/${facturaId}/pago`, data),
  registrarPagoDirecto: (clienteId: string, data: { monto: number; descripcion?: string; observaciones?: string }) =>
    api.post(`/clientes/${clienteId}/pago-directo`, data),
};

// API de Empleados
export const empleadosApi = {
  obtenerTodos: (incluirInactivos?: boolean) => {
    const params = incluirInactivos ? '?incluirInactivos=true' : '';
    return api.get(`/empleados${params}`);
  },
  obtenerPorId: (id: string) =>
    api.get(`/empleados/${id}`),
  crear: (data: any) =>
    api.post('/empleados', data),
  actualizar: (id: string, data: any) =>
    api.put(`/empleados/${id}`, data),
  eliminar: (id: string) =>
    api.delete(`/empleados/${id}`),
  registrarPago: (id: string, data: any) =>
    api.post(`/empleados/${id}/pagos`, data),
  registrarAdelanto: (id: string, data: any) =>
    api.post(`/empleados/${id}/adelantos`, data),
  registrarAsistencia: (id: string, data: any) =>
    api.post(`/empleados/${id}/asistencias`, data),
  agregarDocumento: (id: string, data: any) =>
    api.post(`/empleados/${id}/documentos`, data),
};

// API de Gastos
export const gastosApi = {
  obtenerTodos: (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return api.get(`/gastos?${params.toString()}`);
  },
  obtenerPorId: (id: string) =>
    api.get(`/gastos/${id}`),
  crear: (data: any) =>
    api.post('/gastos', data),
  actualizar: (id: string, data: any) =>
    api.put(`/gastos/${id}`, data),
  eliminar: (id: string) =>
    api.delete(`/gastos/${id}`),
  obtenerResumen: (fechaInicio: string, fechaFin: string) =>
    api.get(`/gastos/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
};

// API de Proveedores
export const proveedoresApi = {
  obtenerTodos: () =>
    api.get('/proveedores'),
  obtenerPorId: (id: string) =>
    api.get(`/proveedores/${id}`),
  crear: (data: any) =>
    api.post('/proveedores', data),
  actualizar: (id: string, data: any) =>
    api.put(`/proveedores/${id}`, data),
  obtenerCuentaCorriente: (proveedorId: string) =>
    api.get(`/proveedores/${proveedorId}/cuenta-corriente`),
  obtenerFacturas: (proveedorId: string) =>
    api.get(`/proveedores/${proveedorId}/facturas`),
  obtenerFacturaPorId: (id: string) =>
    api.get(`/proveedores/facturas/${id}`),
  registrarPago: (facturaId: string, data: { monto: number; metodoPago?: string; observaciones?: string }) =>
    api.post(`/proveedores/facturas/${facturaId}/pago`, data),
  cargarFactura: (proveedorId: string, data: any) =>
    api.post(`/proveedores/${proveedorId}/facturas`, data),
};

// API de Retiros
export const retirosApi = {
  obtenerTodos: (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return api.get(`/retiros?${params.toString()}`);
  },
  crear: (data: any) =>
    api.post('/retiros', data),
  eliminar: (id: string) =>
    api.delete(`/retiros/${id}`),
};

// API de Reportes
export const reportesApi = {
  financiero: (fechaInicio: string, fechaFin: string) =>
    api.get(`/reportes/financiero?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
  socios: (fechaInicio: string, fechaFin: string) =>
    api.get(`/reportes/socios?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
  gastosAvanzado: (fechaInicio: string, fechaFin: string) =>
    api.get(`/reportes/gastos-avanzado?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
};

// API de Configuración
export const configuracionApi = {
  obtenerRecargos: () =>
    api.get('/configuracion/recargos'),
  actualizarRecargos: (data: { recargoDebitoPct: number; recargoCreditoPct: number }, usuarioId?: string) =>
    api.put(`/configuracion/recargos${usuarioId ? `?usuarioId=${usuarioId}` : ''}`, data),
};

export default api;
