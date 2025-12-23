import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalLoading } from '../context/LoadingContext';
import { ventasApi } from '../services/api';
import { formatearMoneda } from '../utils/formatters';
import Loading from '../components/common/Loading';

// Components
import { ProductSearch } from '../components/ventas/ProductSearch';
import { ProductEditor } from '../components/ventas/ProductEditor';
import { SalesGrid } from '../components/ventas/SalesGrid';
import { ClientSelector } from '../components/ventas/ClientSelector';
import { PaymentWidget } from '../components/ventas/PaymentWidget';
import '../components/ventas/VentasComponents.css';
import { withInteractionTracking } from '../perf/eventTiming';
import { startFlow, endFlow, mark, measure } from '../perf/userTiming';

const NuevaVentaPage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useGlobalLoading();

    // -- ESTADO GLOBAL DE LA VENTA --
    const [items, setItems] = useState<any[]>([]);
    const [client, setClient] = useState<any | null>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [isCC, setIsCC] = useState(false);

    // Estado UI
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // -- CÁLCULOS --
    const subtotal = useMemo(() => items.reduce((acc, i) => acc + i.subtotal, 0), [items]);
    const total = subtotal; // Aquí podrían ir descuentos globales
    const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.monto, 0), [payments]);
    const remaining = Math.max(0, total - totalPaid);

    // Utilidad: ejecutar después del siguiente paint para no bloquear el frame del click
    const runAfterNextPaint = (fn: () => void) => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => setTimeout(fn, 0));
        } else {
            setTimeout(fn, 0);
        }
    };

    // -- HANDLERS --
    const handleProductSelect = withInteractionTracking('producto_modal_open', (product: any) => {
        setSelectedProduct(product);
        endFlow('producto_modal_open_flujo');
    });

    const handleAddItem = (item: any) => {
        setItems([...items, item]);
        setSelectedProduct(null);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleQtyChange = (index: number, delta: number) => {
        setItems((prev) => {
            const next = [...prev];
            const item = next[index];
            if (!item) return prev;

            const current = Number(item.cantidad || 0);
            const desired = current + delta;
            const min = 1;
            const max = item.stockMaximo !== undefined ? Number(item.stockMaximo) : Number.POSITIVE_INFINITY;
            const clamped = Math.max(min, Math.min(desired, max));
            if (clamped === current) return prev;

            const precio = Number(item.precioUnitario || 0);
            next[index] = {
                ...item,
                cantidad: clamped,
                subtotal: clamped * precio,
            };
            return next;
        });
    };

    const handleClientSelect = (c: any | null) => {
        setClient(c);
        setIsCC(false); // Reset CC switch when client changes
    };

    const handleConfirm = withInteractionTracking('venta_confirmar_click', async () => {
        startFlow('venta_confirmar_flujo');
        if (items.length === 0) return setError("El carrito está vacío");
        if (!isCC && remaining > 0) return setError("El pago no está completo");
        if (isCC && !client) return setError("Debe seleccionar un cliente para Cuenta Corriente");

        setLoading(true);
        showLoading("Procesando venta...");
        setError(null);

        // Deferir el trabajo pesado (creación de DTO + llamada) a después del próximo paint
        runAfterNextPaint(async () => {
            // CONSTRUCCIÓN DEL DTO EXACTO
            const saleDTO = {
                vendedorId: user?.id,
                items: items.map(i => ({
                    productoId: i.productoId,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioUnitario
                })),
                clienteDNI: client?.dni,
                clienteNombre: client ? `${client.nombre} ${client.apellido} ` : undefined,
                esCuentaCorriente: isCC,
                metodosPago: isCC
                    ? [{ type: 'CUENTA_CORRIENTE', monto: total }] // Backend derived type
                    : payments,
                tipoComprobante: 'REMITO', // Default por ahora
                observaciones: 'Venta POS'
            };

            try {
                mark('venta_request_start');
                // 1) tiempo hasta request enviada (desde inicio del flujo)
                measure('venta_time_to_request', 'venta_confirmar_flujo:start', 'venta_request_start');

                await ventasApi.crear(saleDTO);
                mark('venta_response_received');
                // 2) backend (aprox) = request_start -> response_received
                measure('venta_backend_time', 'venta_request_start', 'venta_response_received');

                setSuccess("Venta registrada correctamente ✅");
                // Reset form
                setItems([]);
                setPayments([]);
                setClient(null);
                setIsCC(false);
                setTimeout(() => setSuccess(null), 3000);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || "Error al procesar la venta");
            } finally {
                setLoading(false);
                hideLoading();
                // 3) UI finalizada: después del próximo paint tras setStates
                requestAnimationFrame(() => {
                    mark('venta_ui_finalizada');
                    measure('venta_ui_post_time', 'venta_response_received', 'venta_ui_finalizada');
                    measure('venta_total_until_ui_final', 'venta_confirmar_flujo:start', 'venta_ui_finalizada');
                    endFlow('venta_confirmar_flujo');
                });
            }
        });
    });

    return (
        <div className="pos-layout">
            {loading && <Loading fullScreen mensaje="Procesando venta..." />}
            {/* PANEL IZQUIERDO: OPERATIVO */}
            <div className="pos-left">
                <ProductSearch onProductSelect={handleProductSelect} />

                {selectedProduct && (
                    <ProductEditor
                        product={selectedProduct}
                        onAdd={handleAddItem}
                        onCancel={() => setSelectedProduct(null)}
                    />
                )}

                <SalesGrid items={items} onRemove={handleRemoveItem} onQtyChange={handleQtyChange} />
            </div>

            {/* PANEL DERECHO: FINANCIERO */}
            <div className="pos-right">
                {error && <div className="pos-error-toast">{error}</div>}
                {success && <div className="pos-success-toast">{success}</div>}

                <ClientSelector selectedClient={client} onClientSelect={handleClientSelect} />

                {client && client.tieneCuentaCorriente && (
                    <div className="account-switch-panel">
                        <label className="switch-label">
                            💳 Usar Cuenta Corriente
                            <input
                                type="checkbox"
                                checked={isCC}
                                onChange={e => {
                                    setIsCC(e.target.checked);
                                    setPayments([]); // Clear manual payments if CC active
                                }}
                                style={{ marginLeft: '10px' }}
                            />
                        </label>
                    </div>
                )}

                <PaymentWidget
                    totalToPay={total}
                    payments={payments}
                    onAddPayment={p => setPayments([...payments, p])}
                    onRemovePayment={idx => {
                        const newP = [...payments];
                        newP.splice(idx, 1);
                        setPayments(newP);
                    }}
                    isCuentaCorriente={isCC}
                />

                <div className="pos-sticky-confirm">
                    <button
                        className="btn-confirm-pos"
                        disabled={loading || items.length === 0 || (!isCC && remaining > 0)}
                        onClick={handleConfirm}
                    >
                        {loading ? 'PROCESANDO...' : `CONFIRMAR (${formatearMoneda(total)})`}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NuevaVentaPage;
