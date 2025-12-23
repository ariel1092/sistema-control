import React, { useState, useEffect, useRef } from 'react';
import StatusModal from '../common/StatusModal';

interface ProductEditorProps {
    product: any;
    onAdd: (item: any) => void;
    onCancel: () => void;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, onAdd, onCancel }) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(product.precioVenta);
    const [showError, setShowError] = useState(false);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (qtyInputRef.current) {
            qtyInputRef.current.focus();
            qtyInputRef.current.select();
        }
    }, []);

    const handleAdd = () => {
        if (quantity <= 0) return;
        if (quantity > product.stockActual) {
            setShowError(true);
            return;
        }

        onAdd({
            productoId: product.id,
            codigo: product.codigo,
            nombre: product.nombre,
            cantidad: quantity,
            precioUnitario: price,
            subtotal: quantity * price,
            stockMaximo: product.stockActual
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="product-editor-panel">
            <StatusModal 
                show={showError}
                type="error"
                title="Stock insuficiente"
                message={`No puedes agregar más de ${product.stockActual} unidades de este producto.`}
                onClose={() => setShowError(false)}
            />
            <div className="editor-header">
                <h4>{product.nombre}</h4>
                <span className="stock-info">Disponible: {product.stockActual}</span>
            </div>

            <div className="editor-controls">
                <div className="control-group">
                    <label>Cantidad</label>
                    <input
                        ref={qtyInputRef}
                        type="number"
                        inputMode="numeric"
                        className="pos-input qty-input"
                        min="1"
                        max={product.stockActual}
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value))}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="control-group">
                    <label>Precio Unit.</label>
                    <input
                        type="number"
                        inputMode="decimal"
                        className="pos-input price-input"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value))}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="editor-actions">
                    <button className="btn-pos secondary" onClick={onCancel}>Cancelar</button>
                    <button className="btn-pos primary" onClick={handleAdd}>Agregar</button>
                </div>
            </div>
        </div>
    );
};
