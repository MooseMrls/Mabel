import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => { setToken(null); setUser(null); setConfig(null); }, []);

  const loadConfig = useCallback(async () => setConfig(await api.get('/config')), []);

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me')
      .then(async (r) => { setUser(r.user); await loadConfig(); })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [loadConfig]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const login = async (uniqueId) => {
    const r = await api.post('/auth/login', { uniqueId });
    setToken(r.token);
    setUser(r.user);
    await loadConfig();
    return r.user;
  };

  return <Ctx.Provider value={{ user, config, loading, login, logout }}>{children}</Ctx.Provider>;
}
