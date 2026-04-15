import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify auth on mount using cookies
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await authAPI.me();
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    // 1. Get CSRF Cookie first
    await authAPI.csrfCookie();
    
    // 2. Perform login
    const response = await authAPI.login({ email, password });
    const { user: userData } = response.data;
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    // 1. Get CSRF Cookie first
    await authAPI.csrfCookie();
    
    // 2. Perform registration
    const response = await authAPI.register(data);
    const { user: userData } = response.data;
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout errors
    }
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
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
