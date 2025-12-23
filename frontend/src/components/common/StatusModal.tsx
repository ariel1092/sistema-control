import React from 'react';
import './StatusModal.css';

interface StatusModalProps {
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ show, type, title, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="status-modal-overlay" onClick={onClose}>
            <div className={`status-modal-content ${type}`} onClick={(e) => e.stopPropagation()}>
                <div className="status-modal-icon">
                    {type === 'success' ? '✅' : '❌'}
                </div>
                <h2 className="status-modal-title">{title}</h2>
                <p className="status-modal-message">{message}</p>
                <button className={`status-modal-button ${type}`} onClick={onClose}>
                    Aceptar
                </button>
            </div>
        </div>
    );
};

export default StatusModal;





