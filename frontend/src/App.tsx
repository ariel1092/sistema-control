import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Loading from './components/common/Loading';
import GlobalLoader from './components/ui/GlobalLoader';
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
const POSPage = lazy(() => import('./pages/POSPage'));
const ConfiguracionRecargosPage = lazy(() => import('./pages/ConfiguracionRecargosPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen mensaje="Verificando sesión..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente de loading para Suspense
const PageLoader = () => <Loading mensaje="Cargando página..." />;

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
                    <Route path="/ventas/nueva" element={<POSPage />} />
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/caja" element={<CajaPage />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/empleados" element={<EmpleadosPage />} />
                    <Route path="/gastos" element={<GastosPage />} />
                    <Route path="/reportes" element={<ReportesPage />} />
                    <Route path="/proveedores" element={<ProveedoresPage />} />
                    <Route path="/configuracion/recargos" element={<ConfiguracionRecargosPage />} />
                    <Route path="/pos" element={<POSPage />} />
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
    <LoadingProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalLoader />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
