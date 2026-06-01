import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { verify2fa } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Verify2FAPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { pending_2fa_id: pending2faId } = router.query;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pending2faId) {
      setError('Сессия входа не найдена. Выполните вход снова.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await verify2fa(pending2faId, code.trim());
      setAuth(data.user, data.token);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const noPendingId = router.isReady && !pending2faId;

  return (
    <div className="authPage-shell">
      <div className="authPage">
        <h1 className="authPage__title">Код из письма</h1>
        <p className="authPage__subtitle">Введите 6-значный код, отправленный на вашу почту</p>
      {noPendingId && (
        <p className="authPage__error">Сессия входа не найдена. <Link href="/auth/login">Войдите снова</Link>.</p>
      )}
      <form className="authPage__form" onSubmit={handleSubmit}>
        {error && <p className="authPage__error">{error}</p>}
        <div className="authPage__field">
          <label htmlFor="code" className="authPage__label">Код</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="authPage__input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            disabled={noPendingId}
          />
        </div>
        <div className="authPage__actions">
          <button type="submit" className="authPage__submit" disabled={loading || noPendingId || code.length !== 6}>
            {loading ? 'Проверка…' : 'Войти'}
          </button>
          <div className="authPage__links">
            <Link href="/auth/login" className="authPage__link">Назад к входу</Link>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
