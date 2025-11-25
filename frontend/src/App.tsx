import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;


