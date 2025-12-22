import React, { useState, useEffect, useRef } from 'react';
import { productosApi, proveedoresApi } from '../../services/api';
import { formatearMoneda } from '../../utils/formatters';

interface POSProductSearchProps {
    onSelect: (product: any) => void;
}

export const POSProductSearch: React.FC<POSProductSearchProps> = ({ onSelect }) => {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [proveedores, setProveedores] = useState<any[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Cargar nombres de proveedores
    useEffect(() => {
        proveedoresApi.obtenerTodos()
            .then(res => setProveedores(res.data || []))
            .catch(err => console.error(err));
    }, []);

    // Búsqueda real con debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (term.length >= 2) {
                try {
                    setLoading(true);
                    const res = await productosApi.buscar(term);
                    const data = res.data.data || res.data;
                    setResults(Array.isArray(data) ? data : []);
                    setShowResults(true);
                } catch (error) {
                    console.error("POS Search Error", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [term]);

    const handleSelect = (p: any) => {
        if (p.stockActual <= 0) return;
        onSelect(p);
        setTerm('');
        setShowResults(false);
    };

    return (
        <div className="pos-search-container" ref={wrapperRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="pos-input-large"
                    placeholder="Escriba código o nombre... (mín. 2 letras)"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    autoFocus
                />
                {loading && <div className="pos-search-spinner"></div>}
            </div>

            {showResults && (
                <ul className="pos-search-results">
                    {results.length > 0 ? (
                        results.map(p => (
                            <li 
                                key={p.id} 
                                className={`pos-result-item ${p.stockActual <= 0 ? 'disabled' : ''}`}
                                onClick={() => handleSelect(p)}
                            >
                                <div className="result-main">
                                    <span className="result-code">{p.codigo}</span>
                                    <span className="result-name">{p.nombre}</span>
                                    <span className="result-provider">
                                        {proveedores.find(pr => pr.id === p.proveedorId)?.nombre}
                                    </span>
                                </div>
                                <div className="result-meta">
                                    <span className={`result-stock ${p.stockActual <= 5 ? 'low' : ''}`}>
                                        Stock: {p.stockActual}
                                    </span>
                                    <span className="result-price">{formatearMoneda(p.precioVenta)}</span>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="pos-no-results">No se encontraron productos</li>
                    )}
                </ul>
            )}
        </div>
    );
};

