import { useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
};

export function useRegister() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || (data.errors
          ? Object.values(data.errors).flat().join(' ')
          : 'Ошибка регистрации');
        setError(msg);
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
    form,
    updateField,
    error,
    loading,
    handleSubmit,
  };
}
