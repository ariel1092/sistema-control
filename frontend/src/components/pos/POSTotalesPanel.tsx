import React from 'react';
import { formatearMoneda } from '../../utils/formatters';

interface POSTotalesPanelProps {
    subtotal: number;
    descuento: number;
    total: number;
    change: number;
    isFullyPaid: boolean;
}

export const POSTotalesPanel: React.FC<POSTotalesPanelProps> = ({ 
    subtotal, 
    descuento, 
    total, 
    change,
    isFullyPaid
}) => {
    return (
        <div className={`pos-totals-panel ${isFullyPaid ? 'paid-ok' : ''}`}>
            <div className="total-row">
                <span>Subtotal</span>
                <span>{formatearMoneda(subtotal)}</span>
            </div>
            <div className="total-row highlight">
                <span>Descuento</span>
                <span>-{formatearMoneda(descuento)}</span>
            </div>
            
            {change > 0 && (
                <div className="total-row change-row">
                    <span>VUELTO</span>
                    <span>{formatearMoneda(change)}</span>
                </div>
            )}

            {isFullyPaid && (
                <div className="paid-badge">
                    <span className="icon">✅</span>
                    <span className="text">PAGO COMPLETO</span>
                </div>
            )}

            <div className="total-main">
                <span className="total-label">TOTAL</span>
                <span className="total-value">{formatearMoneda(total)}</span>
            </div>
        </div>
    );
};

