import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl, getAuthHeaders, setAuthToken, clearAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(getApiUrl('/user'), { headers: getAuthHeaders() })
      .then((res) => {
        if (res.ok) return res.json();
        clearAuthToken();
        return null;
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => clearAuthToken())
      .finally(() => setLoading(false));
  }, []);

  function setAuth(userData, token) {
    setAuthToken(token);
    setUser(userData);
  }

  async function logout() {
    try {
      await fetch(getApiUrl('/logout'), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (_) {}
    clearAuthToken();
    setUser(null);
    router.push('/');
  }

  async function refreshUser() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/user'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (_) {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, setAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
