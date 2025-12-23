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
    const [loadingClients, setLoadingClients] = useState(false);
    const [allClients, setAllClients] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

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

    const cargarClientes = async () => {
        if (allClients.length > 0 || loadingClients) return;
        try {
            setLoadingClients(true);
            const res = await clientesApi.obtenerTodos();
            const lista = Array.isArray(res.data) ? res.data : [];
            setAllClients(lista);
        } catch (e) {
            setError('No se pudieron cargar los clientes');
        } finally {
            setLoadingClients(false);
        }
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setError(null);

        if (mode === 'REGISTERED' && allClients.length === 0 && term.length >= 2) {
            await cargarClientes();
        }

        if (term.length >= 2) {
            const filtered = allClients.filter((c: any) =>
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(term.toLowerCase()) ||
                c.dni?.toString().includes(term)
            );
            setSearchResults(filtered.slice(0, 10)); // limitar para UI
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
                        <div className="client-search-header">
                            <div>
                                <p className="client-search-title">Cliente Registrado</p>
                                <p className="client-search-subtitle">Escriba DNI o nombre (mínimo 2 caracteres)</p>
                            </div>
                            {loadingClients && <span className="client-pill pill-loading">Cargando...</span>}
                            {error && <span className="client-pill pill-error">{error}</span>}
                        </div>
                        <div className="client-helper-banner">
                            <div className="helper-title">Pasos rápidos</div>
                            <div className="helper-steps">
                                <span>1. Escriba DNI o nombre.</span>
                                <span>2. Toque el resultado para seleccionarlo.</span>
                                <span>3. Verifique datos y continúe.</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            className="pos-input client-search-input"
                            placeholder="Ej: 30123123 o Juan"
                            value={searchTerm}
                            onChange={handleSearch}
                            onFocus={() => mode === 'REGISTERED' && cargarClientes()}
                            inputMode="search"
                        />
                        {searchTerm.length >= 2 && !loadingClients && searchResults.length === 0 && (
                            <div className="client-empty-state">Sin resultados</div>
                        )}
                        {searchResults.length > 0 && (
                            <ul className="client-results-list">
                                {searchResults.map(c => (
                                    <li key={c.id} onClick={() => handleSelect(c)} className="client-result-item">
                                        <div className="client-result-main">
                                            <div className="client-name">{c.nombre} {c.apellido}</div>
                                            <div className="client-dni">DNI: {c.dni}</div>
                                        </div>
                                        {c.tieneCuentaCorriente && (
                                            <span className="client-pill pill-cc">Cuenta Corriente</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {selectedClient && (
                    <div className="selected-client-card">
                        <div className="card-header">
                            <div className="card-title">Cliente seleccionado</div>
                            <button className="btn-link-small" onClick={() => onClientSelect(null)}>Cambiar</button>
                        </div>
                        <div className="card-row">
                            <span className="label">Nombre</span>
                            <span className="value strong">{selectedClient.nombre} {selectedClient.apellido}</span>
                        </div>
                        <div className="card-row">
                            <span className="label">DNI</span>
                            <span className="value">{selectedClient.dni}</span>
                        </div>
                        {selectedClient.tieneCuentaCorriente && (
                            <div className={`card-row balance-row ${clientBalance && clientBalance > 0 ? 'debt' : ''}`}>
                                <span className="label">Saldo Cuenta Corriente</span>
                                <span className="value strong">${clientBalance}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
