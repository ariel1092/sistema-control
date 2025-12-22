import React from 'react';

interface POSAccionesVentaProps {
    onConfirm: () => void;
    onCancel: () => void;
    disabled: boolean;
}

export const POSAccionesVenta: React.FC<POSAccionesVentaProps> = ({ onConfirm, onCancel, disabled }) => {
    return (
        <div className="pos-actions-vertical">
            <div className="pos-actions-row">
                <button className="btn-pos-cancel" onClick={onCancel}>F4 - CANCELAR</button>
                <button className="btn-pos-hold">F8 - PENDIENTE</button>
            </div>
            <button 
                className={`btn-pos-confirm-giant ${disabled ? 'disabled' : 'ready'}`}
                onClick={onConfirm}
                disabled={disabled}
            >
                {disabled ? 'FALTA COMPLETAR PAGO' : 'F12 - CONFIRMAR VENTA'}
            </button>
        </div>
    );
};

