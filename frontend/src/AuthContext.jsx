import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, username, is_staff }
  const [loading, setLoading] = useState(true);  // checking saved token on startup

  // On app load: if there's a saved token, verify it and load user
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('liza_access');
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch {
          localStorage.removeItem('liza_access');
          localStorage.removeItem('liza_refresh');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    localStorage.setItem('liza_access', res.data.access);
    localStorage.setItem('liza_refresh', res.data.refresh);
    const me = await getMe();
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem('liza_access');
    localStorage.removeItem('liza_refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);