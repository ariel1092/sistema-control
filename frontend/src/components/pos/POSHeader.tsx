import React from 'react';
import './POSStyles.css';

interface POSHeaderProps {
    vendedor: string;
    numeroVenta: string;
}

export const POSHeader: React.FC<POSHeaderProps> = ({ vendedor, numeroVenta }) => {
    return (
        <div className="pos-header">
            <div className="header-info">
                <span className="badge-comprobante">REMITO</span>
                <span className="sale-number">#{numeroVenta}</span>
            </div>
            <div className="header-meta">
                <div className="meta-item">
                    <span className="label">Vendedor:</span>
                    <span className="value">{vendedor}</span>
                </div>
                <div className="meta-item">
                    <span className="label">Fecha:</span>
                    <span className="value">{new Date().toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};




