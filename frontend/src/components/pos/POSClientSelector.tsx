import React, { useState, useEffect, useRef } from 'react';
import { clientesApi } from '../../services/api';

interface POSClientSelectorProps {
    client: any | null;
    onChange: (client: any | null) => void;
}

export const POSClientSelector: React.FC<POSClientSelectorProps> = ({ client, onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    setLoading(true);
                    const res = await clientesApi.obtenerTodos();
                    const all = Array.isArray(res.data) ? res.data : [];
                    const filtered = all.filter((c: any) =>
                        `${c.nombre} ${c.apellido || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.dni?.toString().includes(searchTerm)
                    );
                    setResults(filtered.slice(0, 5));
                    setShowResults(true);
                } catch (error) {
                    console.error("Error searching clients", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (c: any) => {
        onChange(c);
        setSearchTerm('');
        setShowResults(false);
    };

    return (
        <div className="pos-sidebar-panel" ref={wrapperRef}>
            <div className="panel-title">CLIENTE</div>
            {!client ? (
                <div className="client-search-container">
                    <div className="search-input-wrapper-compact">
                        <input 
                            type="text" 
                            placeholder="F2 - Buscar por DNI o Nombre..." 
                            className="pos-input-compact" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {loading && <div className="pos-spinner-mini"></div>}
                    </div>
                    
                    {showResults && (
                        <ul className="pos-client-results">
                            {results.length > 0 ? (
                                results.map(c => (
                                    <li key={c.id} onClick={() => handleSelect(c)} className="pos-client-result-item">
                                        <div className="client-main">
                                            <span className="client-name">{c.nombre} {c.apellido}</span>
                                            <span className="client-dni">DNI: {c.dni}</span>
                                        </div>
                                        {c.tieneCuentaCorriente && <span className="badge-cc-mini">CC</span>}
                                    </li>
                                ))
                            ) : (
                                <li className="pos-no-results-mini">No hay resultados</li>
                            )}
                        </ul>
                    )}
                </div>
            ) : (
                <div className="selected-client-mini">
                    <div className="client-info">
                        <span className="name">{client.nombre} {client.apellido}</span>
                        <span className="dni">DNI: {client.dni}</span>
                    </div>
                    <button className="btn-link" onClick={() => onChange(null)}>Cambiar</button>
                </div>
            )}
        </div>
    );
};

