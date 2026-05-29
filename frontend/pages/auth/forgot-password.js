import Link from 'next/link';
import { useState } from 'react';
import { requestPasswordReset } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="authPage">
        <h1 className="authPage__title">Проверьте почту</h1>
        <p className="authPage__text">
          На вашу почту отправлена ссылка для сброса пароля. Ссылка действительна 60 минут.
        </p>
        <Link href="/auth/login" className="authPage__link">Вернуться к входу</Link>
      </div>
    );
  }

  return (
    <div className="authPage">
      <h1 className="authPage__title">Восстановление пароля</h1>
      <form className="authPage__form" onSubmit={handleSubmit}>
        {error && <p className="authPage__error">{error}</p>}
        <div className="authPage__field">
          <label htmlFor="email" className="authPage__label">Email</label>
          <input
            id="email"
            type="email"
            className="authPage__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="authPage__actions">
          <button type="submit" className="authPage__submit" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </button>
          <Link href="/auth/login" className="authPage__link">Вход</Link>
        </div>
      </form>
    </div>
  );
}
