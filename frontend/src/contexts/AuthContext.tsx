import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // OPTIMIZACIÓN: Inicializar desde localStorage inmediatamente (sin esperar useEffect)
    // Esto evita el "flash" de loading y mejora la percepción de velocidad
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      // Si hay error, limpiar datos corruptos
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return null;
  });
  const [loading, setLoading] = useState(false); // Cambiar a false porque ya inicializamos desde localStorage

  useEffect(() => {
    // Validar token en background (no bloquea el render inicial)
    const token = localStorage.getItem('token');
    if (token && user) {
      // Opcional: Validar token con backend en background
      // Por ahora solo verificamos que existe
      // En el futuro se puede agregar validación asíncrona aquí
    } else if (token && !user) {
      // Si hay token pero no user, limpiar
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



