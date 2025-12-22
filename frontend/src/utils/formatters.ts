/**
 * Formatea un número como moneda (ARS por defecto para Argentina)
 * @param monto El número a formatear
 * @returns El string formateado
 */
export const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(monto);
};

/**
 * Formatea un número con separadores de miles y decimales fijos
 * @param num El número a formatear
 * @returns El string formateado
 */
export const formatearNumero = (num: number): string => {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};




