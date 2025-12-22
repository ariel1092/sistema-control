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

    // -- HANDLERS --
    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
    };

    const handleAddItem = (item: any) => {
        setItems([...items, item]);
        setSelectedProduct(null);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleClientSelect = (c: any | null) => {
        setClient(c);
        setIsCC(false); // Reset CC switch when client changes
    };

    const handleConfirm = async () => {
        if (items.length === 0) return setError("El carrito está vacío");
        if (!isCC && remaining > 0) return setError("El pago no está completo");
        if (isCC && !client) return setError("Debe seleccionar un cliente para Cuenta Corriente");

        setLoading(true);
        showLoading("Procesando venta...");
        setError(null);

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
            await ventasApi.crear(saleDTO);
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
        }
    };

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

                <SalesGrid items={items} onRemove={handleRemoveItem} />
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

                <button
                    className="btn-confirm-pos"
                    disabled={loading || items.length === 0 || (!isCC && remaining > 0)}
                    onClick={handleConfirm}
                >
                    {loading ? 'PROCESANDO...' : `CONFIRMAR (${formatearMoneda(total)})`}
                </button>

            </div>
        </div>
    );
};

export default NuevaVentaPage;
