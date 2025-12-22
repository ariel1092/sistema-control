import React, { useReducer, useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { POSHeader } from '../components/pos/POSHeader';
import { POSProductSearch } from '../components/pos/POSProductSearch';
import { POSSalesGrid } from '../components/pos/POSSalesGrid';
import { POSClientSelector } from '../components/pos/POSClientSelector';
import { POSTotalesPanel } from '../components/pos/POSTotalesPanel';
import { POSPagosPanel } from '../components/pos/POSPagosPanel';
import { POSAccionesVenta } from '../components/pos/POSAccionesVenta';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalLoading } from '../context/LoadingContext';
import { cajaApi, configuracionApi, ventasApi } from '../services/api';
import StatusModal from '../components/common/StatusModal';
import '../components/pos/POSStyles.css';

// --- TYPES ---
interface POSPayment {
    id: string;
    tipo: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' | 'CUENTA_CORRIENTE';
    monto: number;
    referencia?: string;
    cuentaBancaria?: 'ABDUL' | 'OSVALDO';
    recargo?: number; // % aplicado (débito/crédito)
}

interface POSItem {
    id: string; // productoId
    codigo: string;
    nombre: string;
    unidadMedida: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    stockMaximo: number;
}

interface POSState {
    items: POSItem[];
    client: any | null;
    payments: POSPayment[];
}

type POSAction = 
    | { type: 'ADD_ITEM'; payload: any }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_QTY'; payload: { id: string, qty: number } }
    | { type: 'SET_CLIENT'; payload: any }
    | { type: 'ADD_PAYMENT'; payload: POSPayment }
    | { type: 'REMOVE_PAYMENT'; payload: string }
    | { type: 'CLEAR_SALE' };

// --- REDUCER ---
const posReducer = (state: POSState, action: POSAction): POSState => {
    switch (action.type) {
        // ... items logic stays the same ...
        case 'ADD_ITEM': {
            const product = action.payload;
            const existing = state.items.find(i => i.id === product.id);
            
            if (existing) {
                const newQty = existing.cantidad + 1;
                if (newQty > product.stockActual) return state; // Bloqueo por stock

                return {
                    ...state,
                    items: state.items.map(i => i.id === product.id 
                        ? { ...i, cantidad: newQty, subtotal: newQty * i.precio } 
                        : i
                    )
                };
            }

            const newItem: POSItem = {
                id: product.id,
                codigo: product.codigo,
                nombre: product.nombre,
                unidadMedida: product.unidadMedida,
                precio: product.precioVenta,
                cantidad: 1,
                subtotal: product.precioVenta,
                stockMaximo: product.stockActual
            };

            return { ...state, items: [...state.items, newItem] };
        }

        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter(i => i.id !== action.payload) };

        case 'UPDATE_QTY':
            return {
                ...state,
                items: state.items.map(i => {
                    if (i.id !== action.payload.id) return i;
                    const qty = Math.min(action.payload.qty, i.stockMaximo);
                    return { ...i, cantidad: qty, subtotal: qty * i.precio };
                })
            };

        case 'SET_CLIENT':
            return { ...state, client: action.payload };

        case 'ADD_PAYMENT':
            return { ...state, payments: [...state.payments, action.payload] };

        case 'REMOVE_PAYMENT':
            return { ...state, payments: state.payments.filter(p => p.id !== action.payload) };

        case 'CLEAR_SALE':
            return { ...state, items: [], client: null, payments: [] };

        default:
            return state;
    }
};

const POSPage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [state, dispatch] = useReducer(posReducer, {
        items: [],
        client: null,
        payments: []
    });

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

    // Cálculos
    const subtotalBase = state.items.reduce((acc, item) => acc + item.subtotal, 0);
    const descuento = 0;

    const [recargosCfg, setRecargosCfg] = useState<{ recargoDebitoPct: number; recargoCreditoPct: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await configuracionApi.obtenerRecargos();
                const data = res?.data || {};
                const recargoDebitoPct = Number((data as any).recargoDebitoPct ?? 0);
                const recargoCreditoPct = Number((data as any).recargoCreditoPct ?? 0);
                if (!cancelled) setRecargosCfg({ recargoDebitoPct, recargoCreditoPct });
            } catch {
                if (!cancelled) setRecargosCfg({ recargoDebitoPct: 0, recargoCreditoPct: 0 });
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const recargoPctFor = (p: POSPayment): number => {
        if (p.tipo === 'DEBITO') return p.recargo ?? recargosCfg?.recargoDebitoPct ?? 0;
        if (p.tipo === 'CREDITO') return p.recargo ?? recargosCfg?.recargoCreditoPct ?? 0;
        return 0;
    };

    const basePaid = state.payments.reduce((acc, p) => {
        const pct = recargoPctFor(p);
        if ((p.tipo === 'DEBITO' || p.tipo === 'CREDITO') && pct > 0) {
            return acc + (p.monto / (1 + pct / 100));
        }
        return acc + p.monto;
    }, 0);

    const recargoTotal = state.payments.reduce((acc, p) => {
        const pct = recargoPctFor(p);
        if ((p.tipo === 'DEBITO' || p.tipo === 'CREDITO') && pct > 0) {
            const base = p.monto / (1 + pct / 100);
            return acc + (p.monto - base);
        }
        return acc;
    }, 0);

    const total = (subtotalBase - descuento) + recargoTotal;
    const totalPaid = state.payments.reduce((acc, p) => acc + p.monto, 0);
    const remaining = Math.max(0, (subtotalBase - descuento) - basePaid); // restante base (sin recargo)
    const isFullyPaid = remaining <= 0.01 && subtotalBase > 0;
    const change = totalPaid > total ? totalPaid - total : 0;

    // --- Caja (P0): bloquear ventas si no existe caja o está cerrada ---
    const [cajaStatus, setCajaStatus] = useState<{
        existeCaja: boolean;
        estado: 'ABIERTO' | 'CERRADO';
    } | null>(null);
    const [cajaChecked, setCajaChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fechaHoy = format(new Date(), 'yyyy-MM-dd');
        (async () => {
            try {
                const response = await cajaApi.obtenerResumen(fechaHoy);
                const data = response?.data || {};
                const existeCaja = (data as any).existeCaja ?? true;
                const estado = (data as any).estado === 'ABIERTO' ? 'ABIERTO' : 'CERRADO';
                if (!cancelled) setCajaStatus({ existeCaja, estado });
            } catch {
                // No mostrar errores técnicos: si no podemos verificar, bloqueamos y pedimos abrir caja.
                if (!cancelled) setCajaStatus({ existeCaja: false, estado: 'CERRADO' });
            } finally {
                if (!cancelled) setCajaChecked(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const cajaPermiteVentas =
        cajaChecked && Boolean(cajaStatus && cajaStatus.existeCaja === true && cajaStatus.estado === 'ABIERTO');
    const ventaBloqueadaPorCaja = cajaChecked && !cajaPermiteVentas;

    const handleAddItem = useCallback((product: any) => {
        dispatch({ type: 'ADD_ITEM', payload: product });
    }, []);

    const handleUpdateQty = (id: string, qty: number) => {
        dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
    };

    const handleRemoveItem = (id: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
    };

    const handleAddPayment = (payment: POSPayment) => {
        dispatch({ type: 'ADD_PAYMENT', payload: payment });
    };

    const handleRemovePayment = (id: string) => {
        dispatch({ type: 'REMOVE_PAYMENT', payload: id });
    };

    const handleCancel = () => {
        if (window.confirm('¿Desea cancelar la venta actual?')) {
            dispatch({ type: 'CLEAR_SALE' });
        }
    };

    const handleConfirm = async () => {
        // P0: No permitir submit ni llamadas al backend si la caja no está ABIERTA.
        if (!cajaPermiteVentas) return;
        if (!isFullyPaid || state.items.length === 0) return;

        try {
            showLoading("Confirmando venta...");
            
            const saleDTO = {
                vendedorId: user?.id,
                clienteDNI: state.client?.dni,
                clienteNombre: state.client ? `${state.client.nombre} ${state.client.apellido || ''}`.trim() : undefined,
                items: state.items.map(item => ({
                    productoId: item.id,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio
                })),
                metodosPago: state.payments.map(p => ({
                    tipo: p.tipo,
                    monto: p.monto,
                    referencia: p.referencia,
                    cuentaBancaria: p.cuentaBancaria,
                    recargo: p.recargo,
                })),
                tipoComprobante: 'REMITO', // Default operativo
                esCuentaCorriente: state.payments.some(p => p.tipo === 'CUENTA_CORRIENTE'),
                observaciones: 'Venta POS Terminal'
            };

            const response = await ventasApi.crear(saleDTO);
            
            if (response.data) {
                setStatusModal({
                    show: true,
                    type: 'success',
                    title: '¡Venta Exitosa!',
                    message: `La venta #${response.data.numero} ha sido registrada correctamente.`
                });
                dispatch({ type: 'CLEAR_SALE' });
                
                // Notificar actualización global
                window.dispatchEvent(new CustomEvent('ventaRegistrada', { 
                    detail: { monto: total, tipo: state.payments[0]?.tipo || 'MIXTO' } 
                }));
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Error al procesar la venta";
            setStatusModal({
                show: true,
                type: 'error',
                title: 'Error en la Venta',
                message: msg
            });
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="pos-container">
            <StatusModal 
                show={statusModal.show}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => setStatusModal({ ...statusModal, show: false })}
            />

            {ventaBloqueadaPorCaja && (
                <div className="alert alert-error" style={{ margin: 16 }}>
                    Debe abrir la caja para registrar ventas
                </div>
            )}

            {/* PANEL IZQUIERDO: CARGA OPERATIVA */}
            <div
                className="pos-left-panel"
                style={ventaBloqueadaPorCaja ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
            >
                <POSHeader 
                    vendedor={user?.nombre || "Usuario"} 
                    numeroVenta="PROXIMA-VTA" 
                />
                <POSProductSearch onSelect={handleAddItem} />
                <POSSalesGrid 
                    items={state.items} 
                    onRemove={handleRemoveItem} 
                    onUpdateQty={handleUpdateQty}
                />
            </div>

            {/* PANEL DERECHO: TOTALES Y PAGOS */}
            <div className="pos-right-panel">
                <div
                    className="pos-sidebar-content"
                    style={ventaBloqueadaPorCaja ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
                >
                    <POSClientSelector 
                        client={state.client} 
                        onChange={(c) => dispatch({ type: 'SET_CLIENT', payload: c })} 
                    />
                    
                <POSPagosPanel 
                    payments={state.payments} 
                    remaining={remaining} 
                    client={state.client}
                    onAdd={handleAddPayment}
                    onRemove={handleRemovePayment}
                    recargos={recargosCfg || { recargoDebitoPct: 0, recargoCreditoPct: 0 }}
                />

                    <POSTotalesPanel 
                        subtotal={subtotalBase} 
                        descuento={descuento} 
                        total={total} 
                        change={change}
                        isFullyPaid={isFullyPaid}
                    />
                </div>

                <div className="pos-sidebar-actions">
                    <POSAccionesVenta 
                        onConfirm={handleConfirm} 
                        onCancel={handleCancel}
                        disabled={ventaBloqueadaPorCaja || !isFullyPaid}
                    />
                </div>
            </div>
        </div>
    );
};

export default POSPage;

