import React, { useState, useEffect, useRef } from 'react';
import { productosApi, proveedoresApi } from '../../services/api';
import { formatearMoneda } from '../../utils/formatters';
import './VentasComponents.css';
import { startFlow } from '../../perf/userTiming';

interface ProductSearchProps {
    onProductSelect: (product: any) => void;
}

interface Proveedor {
    id: string;
    nombre: string;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Cargar proveedores al montar para tener los nombres disponibles
    useEffect(() => {
        proveedoresApi.obtenerTodos().then(res => {
            setProveedores(res.data || []);
        }).catch(err => console.error("Error cargando proveedores para búsqueda", err));
    }, []);

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
        // Marcamos el flujo de apertura de modal de producto
        startFlow('producto_modal_open_flujo');
        onProductSelect(product);
        setSearchTerm('');
        setShowResults(false);
        // El end se dispara cuando el modal se abre en NuevaVentaPage (al setear selectedProduct)
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
                    inputMode="search"
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="item-code">{p.codigo}</span>
                                        <span className="provider-badge">
                                            {proveedores.find(pr => pr.id === p.proveedorId)?.nombre || 'Sin Prov.'}
                                        </span>
                                    </div>
                                    <span className="item-name">{p.nombre}</span>
                                </div>
                                <div className="item-meta">
                                    <span className={`stock-badge ${!hasStock ? 'red' : lowStock ? 'yellow' : 'green'}`}>
                                        Stock: {p.stockActual}
                                    </span>
                                    <span className="item-price">
                                        {formatearMoneda(p.precioVenta)}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
