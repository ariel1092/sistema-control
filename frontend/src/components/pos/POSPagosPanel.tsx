import React, { useState } from 'react';
import { formatearMoneda } from '../../utils/formatters';
import StatusModal from '../common/StatusModal';

interface POSPayment {
    id: string;
    tipo: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' | 'CUENTA_CORRIENTE';
    monto: number;
    referencia?: string;
    cuentaBancaria?: 'ABDUL' | 'OSVALDO';
    recargo?: number; // % aplicado (solo débito/crédito)
}

interface POSPagosPanelProps {
    payments: POSPayment[];
    remaining: number;
    client: any | null;
    onAdd: (p: POSPayment) => void;
    onRemove: (id: string) => void;
    recargos?: { recargoDebitoPct: number; recargoCreditoPct: number };
}

export const POSPagosPanel: React.FC<POSPagosPanelProps> = ({ 
    payments, 
    remaining, 
    client,
    onAdd,
    onRemove,
    recargos
}) => {
    const [selectedType, setSelectedType] = useState<POSPayment['tipo']>('EFECTIVO');
    const [monto, setMonto] = useState<string>('');
    const [referencia, setReferencia] = useState('');
    const [cuentaBancaria, setCuentaBancaria] = useState<'ABDUL' | 'OSVALDO'>('ABDUL');
    const [showError, setShowError] = useState(false);

    const handleAdd = () => {
        const val = parseFloat(monto) || (remaining > 0 ? remaining : 0);
        if (val <= 0) return; // Bloquear pagos de $0
        
        // Bloqueo para no-efectivo si supera el restante
        if (selectedType !== 'EFECTIVO' && val > remaining + 0.01) {
            setShowError(true);
            return;
        }

        const recargoPct =
          selectedType === 'DEBITO'
            ? (recargos?.recargoDebitoPct ?? 0)
            : selectedType === 'CREDITO'
              ? (recargos?.recargoCreditoPct ?? 0)
              : 0;

        const montoFinal =
          (selectedType === 'DEBITO' || selectedType === 'CREDITO') && recargoPct > 0
            ? (val * (1 + recargoPct / 100))
            : val;

        onAdd({
            id: Math.random().toString(),
            tipo: selectedType,
            monto: montoFinal,
            referencia: (selectedType === 'TRANSFERENCIA' || selectedType === 'DEBITO' || selectedType === 'CREDITO') ? (referencia || 'S/R') : undefined,
            cuentaBancaria: selectedType === 'TRANSFERENCIA' ? cuentaBancaria : undefined,
            recargo: (selectedType === 'DEBITO' || selectedType === 'CREDITO') ? recargoPct : undefined,
        });

        setMonto('');
        setReferencia('');
    };

    return (
        <div className="pos-sidebar-panel">
            <StatusModal 
                show={showError}
                type="error"
                title="Monto no válido"
                message="Solo los pagos en efectivo permiten ingresar un monto mayor al total (para calcular el vuelto)."
                onClose={() => setShowError(false)}
            />
            <div className="panel-title">FORMA DE PAGO</div>
            
            <div className="payment-options">
                {(['EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'CUENTA_CORRIENTE'] as const).map(t => {
                    const isCC = t === 'CUENTA_CORRIENTE';
                    const canUseCC = client && client.tieneCuentaCorriente;
                    const isDisabled = isCC && !canUseCC;

                    return (
                        <button 
                            key={t}
                            className={`btn-payment ${selectedType === t ? 'active' : ''} ${isDisabled ? 'btn-disabled' : ''}`}
                            onClick={() => !isDisabled && setSelectedType(t)}
                            title={isDisabled ? 'Seleccione un cliente con Cta. Cte. habilitada' : ''}
                            disabled={isDisabled}
                        >
                            {isCC ? 'CTA. CTE.' : t}
                        </button>
                    );
                })}
            </div>

            {remaining > 0 || selectedType === 'EFECTIVO' ? (
                <div className="payment-form">
                    <div className="payment-input-row">
                        <input 
                            type="number" 
                            placeholder={`Monto (${remaining > 0 ? remaining : 0})`} 
                            className="pos-input-compact" 
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            onFocus={() => !monto && remaining > 0 && setMonto(remaining.toString())}
                        />
                        <button 
                            className="btn-add" 
                            onClick={handleAdd}
                            disabled={remaining <= 0 && selectedType !== 'EFECTIVO'}
                        >
                            +
                        </button>
                    </div>
                    {selectedType !== 'EFECTIVO' && selectedType !== 'CUENTA_CORRIENTE' && (
                        <div className="mt-2 flex flex-col gap-2">
                            {(selectedType === 'DEBITO' || selectedType === 'CREDITO') && (
                                <div className="client-helper-banner" style={{ marginBottom: 8 }}>
                                    <div className="helper-title">Recargo automático</div>
                                    <div className="helper-steps">
                                        <span>
                                            {selectedType === 'DEBITO'
                                                ? `Débito: ${recargos?.recargoDebitoPct ?? 0}%`
                                                : `Crédito: ${recargos?.recargoCreditoPct ?? 0}%`}
                                        </span>
                                        <span>Se aplica automáticamente al confirmar el pago.</span>
                                    </div>
                                </div>
                            )}
                            {selectedType === 'TRANSFERENCIA' && (
                                <div className="flex gap-2 mb-2">
                                    <button 
                                        className={`btn-account-opt ${cuentaBancaria === 'ABDUL' ? 'active' : ''}`}
                                        onClick={() => setCuentaBancaria('ABDUL')}
                                    >
                                        CTA. ABDUL
                                    </button>
                                    <button 
                                        className={`btn-account-opt ${cuentaBancaria === 'OSVALDO' ? 'active' : ''}`}
                                        onClick={() => setCuentaBancaria('OSVALDO')}
                                    >
                                        CTA. OSVALDO
                                    </button>
                                </div>
                            )}
                            <input 
                                type="text" 
                                placeholder="Referencia / Operación" 
                                className="pos-input-compact" 
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="payment-complete-msg">✅ TOTAL CUBIERTO</div>
            )}

            {payments.length > 0 && (
                <div className="payments-list">
                    {payments.map(p => (
                        <div key={p.id} className="payment-item-row">
                            <span className="type">{p.tipo}</span>
                            <span className="amount">{formatearMoneda(p.monto)}</span>
                            <button className="btn-remove-p" onClick={() => onRemove(p.id)}>&times;</button>
                        </div>
                    ))}
                </div>
            )}

            {remaining > 0 && (
                <div className="remaining-badge">
                    Faltan: {formatearMoneda(remaining)}
                </div>
            )}
        </div>
    );
};

