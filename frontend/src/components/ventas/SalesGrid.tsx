import React from 'react';
import { formatearMoneda } from '../../utils/formatters';

interface SalesGridProps {
    items: any[];
    onRemove: (index: number) => void;
    onQtyChange?: (index: number, delta: number) => void;
}

export const SalesGrid: React.FC<SalesGridProps> = ({ items, onRemove, onQtyChange }) => {
    return (
        <div className="sales-grid-container">
            {/* MOBILE: cards (sin tablas) */}
            <div className="sales-cards">
                {items.length === 0 ? (
                    <div className="empty-grid-state">
                        <span className="empty-icon">🛒</span>
                        <p>Escanee o busque productos para comenzar</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div key={idx} className="sale-card">
                            <div className="sale-card-title">{item.nombre}</div>
                            <div className="sale-card-meta">
                                <span><strong>Código:</strong> {item.codigo}</span>
                                <span><strong>Unit:</strong> {formatearMoneda(item.precioUnitario)}</span>
                                <span><strong>Subtotal:</strong> {formatearMoneda(item.subtotal)}</span>
                            </div>

                            <div className="sale-card-actions">
                                <div className="sale-card-qty" aria-label="Cantidad">
                                    <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() => onQtyChange?.(idx, -1)}
                                        aria-label="Disminuir cantidad"
                                        disabled={!onQtyChange || item.cantidad <= 1}
                                    >
                                        −
                                    </button>
                                    <div className="qty-value">{item.cantidad}</div>
                                    <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() => onQtyChange?.(idx, +1)}
                                        aria-label="Aumentar cantidad"
                                        disabled={!onQtyChange || (item.stockMaximo !== undefined && item.cantidad >= item.stockMaximo)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="btn-delete-mobile"
                                    onClick={() => onRemove(idx)}
                                    aria-label="Eliminar producto"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* DESKTOP: grid/tabular existente */}
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
                            <div className="col-price">{formatearMoneda(item.precioUnitario)}</div>
                            <div className="col-subtotal">{formatearMoneda(item.subtotal)}</div>
                            <div className="col-action">
                                <button
                                    type="button"
                                    className="btn-icon-delete"
                                    onClick={() => onRemove(idx)}
                                    aria-label="Eliminar"
                                >
                                    ×
                                </button>
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
