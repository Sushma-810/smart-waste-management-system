import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, setSessionExpiredHandler, tokenStore } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      toast.info('Your session expired. Please sign in again.');
    });
  }, [toast]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi.me()
      .then((res) => setUser(res.data.user || res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details);
    if (data.token) { tokenStore.set(data.token); setUser(data.user); }
    return data;
  }, []);

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
