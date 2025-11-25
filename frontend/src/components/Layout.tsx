import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout-container">
      {/* Botón Hamburger para móviles */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${sidebarOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Menú Lateral */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-logo">🏪 Ventas Ferretería</h1>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/ventas" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Ventas</span>
          </NavLink>
          
          <NavLink 
            to="/productos" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Productos</span>
          </NavLink>
          
          <NavLink 
            to="/caja" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">💵</span>
            <span className="nav-text">Caja</span>
          </NavLink>
          
          <NavLink 
            to="/clientes" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Clientes</span>
          </NavLink>
          
          <NavLink 
            to="/empleados" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">👔</span>
            <span className="nav-text">Empleados</span>
          </NavLink>

          <NavLink 
            to="/gastos" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">💸</span>
            <span className="nav-text">Gastos Diarios</span>
          </NavLink>

          <NavLink 
            to="/reportes" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Reportes</span>
          </NavLink>

          <NavLink 
            to="/proveedores" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">🏭</span>
            <span className="nav-text">Proveedores</span>
          </NavLink>
                </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;

