import { useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../lib/api';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.errors?.email?.[0] || 'Ошибка входа');
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
