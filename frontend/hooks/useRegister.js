import { useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl, getApiHeaders } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../lib/phone';
import { isPasswordPairReady, validatePassword } from '../lib/validation';

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
  const [phoneError, setPhoneError] = useState(''); 
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    if (field === 'phone') {
      const digits = normalizeDigits(value);
      setForm((prev) => ({ ...prev, phone: digits }));
      setPhoneError('');
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPhoneError('');
    if (!isValidPhoneDigits(form.phone)) {
      setPhoneError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    if (!isPasswordPairReady(form.password, form.password_confirmation)) {
      return;
    }
    setLoading(true);
    const payload = { ...form, phone: parsePhoneToDigits(form.phone) };
    try {
      const res = await fetch(getApiUrl('/register'), {
        method: 'POST',
        headers: getApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || (data.errors
          ? Object.values(data.errors).flat().join(' ')
          : 'Ошибка регистрации');
        setError(msg);
        return;
      }
      if (data.require_verification) {
        router.push('/auth/check-email');
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

  const passwordReady = isPasswordPairReady(form.password, form.password_confirmation);

  return {
    form,
    updateField,
    error,
    phoneError,
    loading,
    passwordReady,
    handleSubmit,
  };
}
