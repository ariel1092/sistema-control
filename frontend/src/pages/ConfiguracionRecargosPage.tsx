import { useEffect, useState } from 'react';
import { configuracionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type RecargosConfig = {
  recargoDebitoPct: number;
  recargoCreditoPct: number;
};

export default function ConfiguracionRecargosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cfg, setCfg] = useState<RecargosConfig>({ recargoDebitoPct: 0, recargoCreditoPct: 0 });

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await configuracionApi.obtenerRecargos();
      setCfg({
        recargoDebitoPct: Number(res.data?.recargoDebitoPct ?? 0),
        recargoCreditoPct: Number(res.data?.recargoCreditoPct ?? 0),
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    try {
      setLoading(true);
      setError(null);
      await configuracionApi.actualizarRecargos(
        {
          recargoDebitoPct: Number(cfg.recargoDebitoPct),
          recargoCreditoPct: Number(cfg.recargoCreditoPct),
        },
        user?.id,
      );
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(null), 3000);
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">Configuración de Recargos</h1>
        <p className="page-subtitle">Definí el % automático para Débito y Crédito</p>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" onClick={() => setSuccess(null)}>
          {success}
        </div>
      )}

      <div className="card" style={{ background: 'white', borderRadius: 12, padding: 20, maxWidth: 520 }}>
        <div className="form-group">
          <label>Recargo Débito (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={cfg.recargoDebitoPct}
            onChange={(e) => setCfg((prev) => ({ ...prev, recargoDebitoPct: Number(e.target.value) }))}
          />
        </div>

        <div className="form-group">
          <label>Recargo Crédito (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={cfg.recargoCreditoPct}
            onChange={(e) => setCfg((prev) => ({ ...prev, recargoCreditoPct: Number(e.target.value) }))}
          />
        </div>

        <button className="btn btn-primary" onClick={guardar} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}




