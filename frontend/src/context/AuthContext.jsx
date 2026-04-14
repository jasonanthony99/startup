import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authAPI.me();
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, access_token } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authAPI.register(data);
    const { user: userData, access_token } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await authAPI.logout();
    } catch {
      // ignore logout errors
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }, [token]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'barangay_admin' || user?.role === 'super_admin',
    isCitizen: user?.role === 'citizen',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
