import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import VentasPage from './pages/VentasPage';
import ProductosPage from './pages/ProductosPage';
import CajaPage from './pages/CajaPage';
import ClientesPage from './pages/ClientesPage';
import EmpleadosPage from './pages/EmpleadosPage';
import GastosPage from './pages/GastosPage';
import ReportesPage from './pages/ReportesPage';
import ProveedoresPage from './pages/ProveedoresPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/ventas" element={<VentasPage />} />
                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/caja" element={<CajaPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/empleados" element={<EmpleadosPage />} />
                <Route path="/gastos" element={<GastosPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/proveedores" element={<ProveedoresPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
