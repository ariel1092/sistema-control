import { ExcelProducto, ExcelError } from './excel-parser.types';

/**
 * Limpia strings monetarios (ej: "$ 1.301,50") y los convierte a number
 */
export const limpiarPrecio = (valor: any): number => {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  // Eliminar $, espacios y puntos de miles, cambiar coma por punto decimal
  const limpio = String(valor)
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
    
  return parseFloat(limpio) || 0;
};

/**
 * Limpia porcentajes (ej: "37%" o "160%")
 */
export const limpiarPorcentaje = (valor: any): number | null => {
  if (typeof valor === 'number') return valor;
  if (!valor) return null;
  
  const limpio = String(valor).replace(/%/g, '').replace(/,/g, '.').trim();
  const num = parseFloat(limpio);
  return isNaN(num) ? null : num;
};

/**
 * Intenta parsear una fecha desde Excel
 */
export const parsearFechaExcel = (valor: any): Date | null => {
  if (valor instanceof Date) return valor;
  if (!valor) return null;
  
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Valida un producto extraído de una fila
 */
export const validarProducto = (producto: Partial<ExcelProducto>, fila: number): ExcelError[] => {
  const errores: ExcelError[] = [];
  
  if (!producto.codigo) {
    errores.push({ fila, mensaje: 'El campo COD es obligatorio' });
  }
  
  if (!producto.nombre) {
    errores.push({ fila, codigo: producto.codigo, mensaje: 'El campo ART (nombre) es obligatorio' });
  }
  
  if (producto.costo !== undefined && producto.costo <= 0) {
    errores.push({ fila, codigo: producto.codigo, mensaje: 'El costo (DCTO) debe ser mayor a 0' });
  }
  
  if (producto.venta !== undefined && producto.costo !== undefined && producto.venta < producto.costo) {
    errores.push({ fila, codigo: producto.codigo, mensaje: 'El precio de VENTA no puede ser menor al COSTO' });
  }
  
  return errores;
};




