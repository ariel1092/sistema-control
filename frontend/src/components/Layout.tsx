import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {

  return (
    <div className="layout-container">
      {/* Menú Lateral */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">🏪 Ventas Ferretería</h1>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/ventas" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Ventas</span>
          </NavLink>
          
          <NavLink 
            to="/productos" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Productos</span>
          </NavLink>
          
          <NavLink 
            to="/caja" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💵</span>
            <span className="nav-text">Caja</span>
          </NavLink>
          
          <NavLink 
            to="/clientes" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Clientes</span>
          </NavLink>
          
          <NavLink 
            to="/empleados" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">👔</span>
            <span className="nav-text">Empleados</span>
          </NavLink>

                  <NavLink 
                    to="/gastos" 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-icon">💸</span>
                    <span className="nav-text">Gastos Diarios</span>
                  </NavLink>

                  <NavLink 
                    to="/reportes" 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="nav-icon">📈</span>
                    <span className="nav-text">Reportes</span>
                  </NavLink>

                  <NavLink 
                    to="/proveedores" 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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

