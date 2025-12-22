import React from 'react';
import loaderImg from '@/assets/loading.jpg'; // Usando el archivo disponible en assets
import { useGlobalLoading } from '../../context/LoadingContext';
import './GlobalLoader.css';

const GlobalLoader: React.FC = () => {
  const { isLoading, message } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-content">
        <div className="loader-image-wrapper">
          <img src={loaderImg} alt="Cargando..." className="loader-image" />
          <div className="loader-glow"></div>
        </div>
        {message && <p className="loader-message">{message}</p>}
      </div>
    </div>
  );
};

export default GlobalLoader;

