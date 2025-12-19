import React from 'react';

interface SalesGridProps {
    items: any[];
    onRemove: (index: number) => void;
}

export const SalesGrid: React.FC<SalesGridProps> = ({ items, onRemove }) => {
    return (
        <div className="sales-grid-container">
            <div className="grid-header">
                <div className="col-code">Código</div>
                <div className="col-name">Producto</div>
                <div className="col-qty">Cant</div>
                <div className="col-price">Unitario</div>
                <div className="col-subtotal">Subtotal</div>
                <div className="col-action"></div>
            </div>

            <div className="grid-content">
                {items.length === 0 ? (
                    <div className="empty-grid-state">
                        <span className="empty-icon">🛒</span>
                        <p>Escanee o busque productos para comenzar</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div key={idx} className="grid-row">
                            <div className="col-code">{item.codigo}</div>
                            <div className="col-name">{item.nombre}</div>
                            <div className="col-qty">{item.cantidad}</div>
                            <div className="col-price">${item.precioUnitario.toLocaleString()}</div>
                            <div className="col-subtotal">${item.subtotal.toLocaleString()}</div>
                            <div className="col-action">
                                <button className="btn-icon-delete" onClick={() => onRemove(idx)}>×</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="grid-footer">
                <span>Items: {items.length}</span>
                <span>Total Unidades: {items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
            </div>
        </div>
    );
};
