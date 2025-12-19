import React, { useState, useEffect, useRef } from 'react';
import { productosApi } from '../../services/api';
import './VentasComponents.css';

interface ProductSearchProps {
    onProductSelect: (product: any) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    const res = await productosApi.buscar(searchTerm);
                    // El backend ahora devuelve { data: Producto[], total: number }
                    const data = res.data.data || res.data;
                    setResults(Array.isArray(data) ? data : []);
                    setShowResults(true);
                } catch (error) {
                    console.error("Error searching products", error);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (product: any) => {
        onProductSelect(product);
        setSearchTerm('');
        setShowResults(false);
    };

    return (
        <div className="product-search-wrapper" ref={wrapperRef}>
            <div className="search-input-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="pos-input search-input"
                    placeholder="Buscar producto por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>

            {showResults && results.length > 0 && (
                <ul className="search-results-list">
                    {results.map((p) => {
                        const hasStock = p.stockActual > 0;
                        const lowStock = p.stockActual <= (p.stockMinimo || 5);

                        return (
                            <li
                                key={p.id}
                                className={`result-item ${!hasStock ? 'out-of-stock' : ''}`}
                                onClick={() => hasStock && handleSelect(p)}
                            >
                                <div className="item-main">
                                    <span className="item-code">{p.codigo}</span>
                                    <span className="item-name">{p.nombre}</span>
                                </div>
                                <div className="item-meta">
                                    <span className={`stock-badge ${!hasStock ? 'red' : lowStock ? 'yellow' : 'green'}`}>
                                        Stock: {p.stockActual}
                                    </span>
                                    <span className="item-price">${p.precioVenta}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
