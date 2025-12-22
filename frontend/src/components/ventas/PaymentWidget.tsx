import React, { useState, useMemo } from 'react';
import { formatearMoneda } from '../../utils/formatters';

interface PaymentWidgetProps {
    totalToPay: number;
    payments: any[];
    onAddPayment: (payment: any) => void;
    onRemovePayment: (index: number) => void;
    isCuentaCorriente: boolean;
}

export const PaymentWidget: React.FC<PaymentWidgetProps> = ({
    totalToPay,
    payments,
    onAddPayment,
    onRemovePayment,
    isCuentaCorriente
}) => {
    const [method, setMethod] = useState('EFECTIVO');
    const [amount, setAmount] = useState<string>('');

    const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.monto, 0), [payments]);
    const remaining = Math.max(0, totalToPay - totalPaid);

    const handleAdd = () => {
        const val = parseFloat(amount || remaining.toString());
        if (val <= 0) return;

        onAddPayment({
            tipo: method,
            monto: val
        });
        setAmount('');
    };

    if (isCuentaCorriente) {
        return (
            <div className="payment-widget disabled">
            <div className="cc-banner">
                <span>Venta en Cuenta Corriente</span>
                <strong>Total a Cargo: {formatearMoneda(totalToPay)}</strong>
            </div>
            </div>
        );
    }

    return (
        <div className="payment-widget">
            <div className="payment-list">
                {payments.map((p, idx) => (
                    <div key={idx} className="payment-item">
                        <span>{p.tipo}</span>
                        <strong>{formatearMoneda(p.monto)}</strong>
                        <button onClick={() => onRemovePayment(idx)}>&times;</button>
                    </div>
                ))}
            </div>

            {remaining > 0 ? (
                <div className="add-payment-row">
                    <select
                        className="pos-input"
                        value={method}
                        onChange={e => setMethod(e.target.value)}
                    >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="DEBITO">Débito</option>
                        <option value="CREDITO">Crédito</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                    <input
                        type="number"
                        className="pos-input"
                        placeholder={`Restante: $${remaining}`}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onFocus={() => setAmount(remaining.toString())}
                    />
                    <button className="btn-pos small" onClick={handleAdd}>+</button>
                </div>
            ) : (
                <div className="payment-complete-msg">
                    ✅ Pago Completo
                </div>
            )}

            <div className="payment-summary-footer">
                <div className="summary-row">
                    <span>Total:</span>
                    <span>{formatearMoneda(totalToPay)}</span>
                </div>
                <div className={`summary-row remaining ${remaining === 0 ? 'ok' : 'pending'}`}>
                    <span>Restante:</span>
                    <span>{formatearMoneda(remaining)}</span>
                </div>
            </div>
        </div>
    );
};
