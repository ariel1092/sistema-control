import React from 'react';
import { formatearMoneda } from '../../utils/formatters';

interface POSSalesGridProps {
    items: any[];
    onRemove: (id: string) => void;
    onUpdateQty: (id: string, qty: number) => void;
}

export const POSSalesGrid: React.FC<POSSalesGridProps> = ({ items, onRemove, onUpdateQty }) => {
    return (
        <div className="pos-grid-container">
            <table className="pos-table">
                <thead>
                    <tr>
                        <th style={{ width: '120px' }}>Código</th>
                        <th>Artículo</th>
                        <th style={{ width: '100px' }} className="text-center">Cant.</th>
                        <th style={{ width: '140px' }} className="text-right">Unitario</th>
                        <th style={{ width: '140px' }} className="text-right">Total</th>
                        <th style={{ width: '50px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="empty-row">
                                <div className="empty-state">
                                    <span>🛒</span>
                                    <p>La venta está vacía. Escanee un producto.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item.id} className={item.cantidad >= item.stockMaximo ? 'row-max-stock' : ''}>
                                <td className="font-mono">{item.codigo}</td>
                                <td>
                                    <div className="item-desc-cell">
                                        <span className="item-name">{item.nombre}</span>
                                        <span className="item-unit">{item.unidadMedida}</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <input 
                                        type="number" 
                                        className="pos-qty-input"
                                        value={item.cantidad}
                                        min="1"
                                        max={item.stockMaximo}
                                        onChange={(e) => onUpdateQty(item.id, parseFloat(e.target.value))}
                                    />
                                    <div className="stock-info-mini">Stock: {item.stockMaximo}</div>
                                </td>
                                <td className="text-right">{formatearMoneda(item.precio)}</td>
                                <td className="text-right font-bold">{formatearMoneda(item.subtotal)}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => onRemove(item.id)}>×</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

