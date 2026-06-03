import { useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl, getApiHeaders } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/login'), {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.errors?.email?.[0] || 'Ошибка входа');
        return;
      }
      if (data.requires_2fa && data.pending_2fa_id) {
        router.push('/auth/verify-2fa?pending_2fa_id=' + encodeURIComponent(data.pending_2fa_id));
        return;
      }
      setAuth(data.user, data.token);
      router.push('/');
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  };
}
