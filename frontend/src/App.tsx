import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// OPTIMIZACIÓN: Lazy loading de páginas para code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VentasPage = lazy(() => import('./pages/VentasPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const CajaPage = lazy(() => import('./pages/CajaPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const GastosPage = lazy(() => import('./pages/GastosPage'));
const ReportesPage = lazy(() => import('./pages/ReportesPage'));
const ProveedoresPage = lazy(() => import('./pages/ProveedoresPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

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

// Componente de loading para Suspense
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '18px',
    color: '#6b7280'
  }}>
    Cargando...
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
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
