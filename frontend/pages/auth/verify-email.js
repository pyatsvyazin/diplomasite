import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { verifyEmail } from '../../lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady || !token || !email) {
      if (router.isReady && (!token || !email)) {
        setStatus('error');
        setMessage('Неверная ссылка для подтверждения почты.');
      }
      return;
    }
    verifyEmail(token, decodeURIComponent(email))
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Почта успешно подтверждена.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Не удалось подтвердить почту.');
      });
  }, [router.isReady, token, email]);

  if (status === 'loading') {
    return (
      <div className="authPage">
        <h1 className="authPage__title">Подтверждение почты</h1>
        <p className="authPage__text">Проверка ссылки…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="authPage">
        <h1 className="authPage__title">Почта подтверждена</h1>
        <p className="authPage__text">{message}</p>
        <Link href="/auth/login" className="authPage__link">Войти в аккаунт</Link>
      </div>
    );
  }

  return (
    <div className="authPage">
      <h1 className="authPage__title">Ошибка</h1>
      <p className="authPage__error">{message}</p>
      <Link href="/auth/login" className="authPage__link">Вход</Link>
      <Link href="/auth/register" className="authPage__link">Регистрация</Link>
    </div>
  );
}
