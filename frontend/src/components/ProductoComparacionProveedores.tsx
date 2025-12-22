import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { productosApi } from '../services/api';
import { formatearMoneda } from '../utils/formatters';

type FuentePrecio = 'MANUAL' | 'FACTURA_PROVEEDOR' | 'ORDEN_COMPRA';

export interface ProductoComparacionProveedoresProps {
  productoId: string;
}

interface ComparacionProveedorRow {
  proveedorId: string;
  proveedorNombre: string;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
  precioNeto: number;
  precioFinal: number;
  fecha: string; // ISO string
  fuente: FuentePrecio;
}

export default function ProductoComparacionProveedores({ productoId }: ProductoComparacionProveedoresProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ComparacionProveedorRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!productoId) return;

    const abortController = new AbortController();
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await productosApi.obtenerPreciosProveedores(productoId, { signal: abortController.signal } as any);
        const items = (res.data?.items || []) as any[];

        const mapped: ComparacionProveedorRow[] = items.map((it) => ({
          proveedorId: it.proveedorId,
          proveedorNombre: it.proveedorNombre,
          precioUnitario: Number(it.precioUnitario) || 0,
          descuentoPct: Number(it.descuentoPct) || 0,
          ivaPct: Number(it.ivaPct) || 0,
          precioNeto: Number(it.precioNeto) || 0,
          precioFinal: Number(it.precioFinal) || 0,
          fecha: it.fecha,
          fuente: it.fuente,
        }));

        // El backend ya devuelve ordenado por precioFinal ASC, pero lo reforzamos.
        mapped.sort((a, b) => a.precioFinal - b.precioFinal);

        if (!ignore) setRows(mapped);
      } catch (e: any) {
        // Si fue cancelación, no mostrar error.
        const isAbort =
          e?.name === 'CanceledError' ||
          e?.code === 'ERR_CANCELED' ||
          String(e?.message || '').toLowerCase().includes('canceled') ||
          abortController.signal.aborted;

        if (!ignore && !isAbort) {
          setRows([]);
          setError(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, [productoId]);

  const cheapestProveedorId = useMemo(() => (rows.length > 0 ? rows[0].proveedorId : null), [rows]);

  return (
    <div className="movimientos-producto">
      <h3>🏷️ Comparación de proveedores</h3>

      {loading ? (
        <div className="alert alert-info">Cargando comparación de proveedores...</div>
      ) : error ? (
        <div className="alert alert-error">No se pudo cargar la comparación de proveedores.</div>
      ) : rows.length === 0 ? (
        <div className="alert alert-info">No hay precios de proveedores cargados para este producto.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="movimientos-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Precio unit.</th>
                  <th>Desc.</th>
                  <th>IVA</th>
                  <th>Precio final</th>
                  <th>Fecha</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isCheapest = cheapestProveedorId && r.proveedorId === cheapestProveedorId;
                  return (
                    <tr key={`${r.proveedorId}-${r.fecha}-${r.fuente}`} style={isCheapest ? { background: '#ecfdf5' } : undefined}>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>{r.proveedorNombre}</span>
                          {isCheapest && <span className="badge badge-stock-ok">Más conveniente</span>}
                        </div>
                      </td>
                      <td>{formatearMoneda(r.precioUnitario)}</td>
                      <td>{r.descuentoPct.toFixed(2)}%</td>
                      <td>{r.ivaPct.toFixed(2)}%</td>
                      <td style={{ fontWeight: 700 }}>{formatearMoneda(r.precioFinal)}</td>
                      <td>{format(new Date(r.fecha), 'dd/MM/yyyy')}</td>
                      <td>{r.fuente}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length === 1 && (
            <div style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
              ℹ️ Solo hay un proveedor cargado. Podés agregar más precios para comparar.
            </div>
          )}
        </>
      )}
    </div>
  );
}


