import { useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../lib/phone';

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
};

// Минимум 8 символов, одна цифра, один спецсимвол (не буква и не пробел)
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[^a-zA-Zа-яА-ЯёЁ0-9\s]).{8,}$/;

function validatePassword(password) {
  if (password.length < 8) return 'Пароль не менее 8 символов.';
  if (!/[0-9]/.test(password)) return 'Добавьте минимум одну цифру.';
  if (!/[^a-zA-Zа-яА-ЯёЁ0-9\s]/.test(password)) return 'Добавьте минимум один спецсимвол (!@#$%^&* и т.д.).';
  return '';
}

export function useRegister() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
    if (field === 'password' || field === 'password_confirmation') setPasswordError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setPhoneError('');
    if (!isValidPhoneDigits(form.phone)) {
      setPhoneError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    const pwdErr = validatePassword(form.password);
    if (pwdErr) {
      setPasswordError(pwdErr);
      return;
    }
    if (form.password !== form.password_confirmation) {
      setPasswordError('Пароли не совпадают.');
      return;
    }
    setLoading(true);
    const payload = { ...form, phone: parsePhoneToDigits(form.phone) };
    try {
      const res = await fetch(getApiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    passwordError,
    phoneError,
    loading,
    handleSubmit,
  };
}
