import React from 'react';
import logoImg from '../../assets/loading.jpg';
import './Loading.css';

interface LoadingProps {
  mensaje?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ mensaje = 'Cargando...', fullScreen = false }) => {
  return (
    <div className={`loading-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className="loading-wrapper">
        <div className="logo-animation">
          <img src={logoImg} alt="Logo Ferretería" className="loading-logo" />
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">{mensaje}</p>
      </div>
    </div>
  );
};

export default Loading;

