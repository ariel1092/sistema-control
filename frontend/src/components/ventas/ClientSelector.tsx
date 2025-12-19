import React, { useState, useEffect } from 'react';
import { clientesApi } from '../../services/api';

interface ClientSelectorProps {
    onClientSelect: (client: any | null) => void;
    selectedClient: any | null;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ onClientSelect, selectedClient }) => {
    const [mode, setMode] = useState<'FINAL' | 'REGISTERED'>('FINAL');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [clientBalance, setClientBalance] = useState<number | null>(null);

    useEffect(() => {
        if (mode === 'FINAL') {
            onClientSelect(null);
            setSearchTerm('');
        }
    }, [mode]);

    useEffect(() => {
        if (selectedClient && selectedClient.tieneCuentaCorriente) {
            clientesApi.obtenerCuentaCorriente(selectedClient.id)
                .then(res => setClientBalance(res.data.saldo || 0))
                .catch(() => setClientBalance(null));
        } else {
            setClientBalance(null);
        }
    }, [selectedClient]);

    // Simple client search simulation (filtering all)
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term.length >= 3) {
            clientesApi.obtenerTodos().then(res => {
                const all = Array.isArray(res.data) ? res.data : [];
                const filtered = all.filter((c: any) =>
                    c.nombre.toLowerCase().includes(term.toLowerCase()) ||
                    c.dni.includes(term)
                );
                setSearchResults(filtered);
            });
        } else {
            setSearchResults([]);
        }
    };

    const handleSelect = (client: any) => {
        onClientSelect(client);
        setSearchTerm('');
        setSearchResults([]);
    };

    return (
        <div className="client-selector-panel">
            <div className="client-tabs">
                <button
                    className={`tab ${mode === 'FINAL' ? 'active' : ''}`}
                    onClick={() => setMode('FINAL')}
                >
                    Consumidor Final
                </button>
                <button
                    className={`tab ${mode === 'REGISTERED' ? 'active' : ''}`}
                    onClick={() => setMode('REGISTERED')}
                >
                    Cliente Registrado
                </button>
            </div>

            <div className="client-content">
                {mode === 'REGISTERED' && !selectedClient && (
                    <div className="client-search-box">
                        <input
                            type="text"
                            className="pos-input"
                            placeholder="Buscar por Nombre o DNI..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        {searchResults.length > 0 && (
                            <ul className="client-results-list">
                                {searchResults.map(c => (
                                    <li key={c.id} onClick={() => handleSelect(c)}>
                                        <strong>{c.nombre} {c.apellido}</strong>
                                        <span className="dni">{c.dni}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {selectedClient && (
                    <div className="selected-client-card">
                        <div className="card-row">
                            <span className="label">Cliente:</span>
                            <span className="value">{selectedClient.nombre} {selectedClient.apellido}</span>
                        </div>
                        <div className="card-row">
                            <span className="label">DNI:</span>
                            <span className="value">{selectedClient.dni}</span>
                        </div>
                        {selectedClient.tieneCuentaCorriente && (
                            <div className={`card-row balance-row ${clientBalance && clientBalance > 0 ? 'debt' : ''}`}>
                                <span className="label">Saldo CC:</span>
                                <span className="value">${clientBalance}</span>
                            </div>
                        )}
                        <button className="btn-link-small" onClick={() => onClientSelect(null)}>Cambiar Cliente</button>
                    </div>
                )}
            </div>
        </div>
    );
};
