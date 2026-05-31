import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { resetPasswordWithToken } from '../../lib/api';
import PasswordRulesChecklist from '../../components/PasswordRulesChecklist';
import PasswordMatchHint from '../../components/PasswordMatchHint';
import { isPasswordPairReady } from '../../lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token, email: queryEmail } = router.query;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (queryEmail) setEmail(decodeURIComponent(queryEmail));
  }, [queryEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordPairReady(password, passwordConfirmation)) {
      return;
    }
    if (!token) {
      setError('Неверная ссылка для сброса пароля');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithToken({
        token,
        email: email || queryEmail,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="authPage">
        <h1 className="authPage__title">Пароль изменён</h1>
        <p className="authPage__text">Теперь вы можете войти с новым паролем.</p>
        <Link href="/auth/login" className="authPage__link">Войти</Link>
      </div>
    );
  }

  const noToken = router.isReady && !token;
  const passwordReady = isPasswordPairReady(password, passwordConfirmation);

  return (
    <div className="authPage">
      <h1 className="authPage__title">Новый пароль</h1>
      {noToken && (
        <p className="authPage__error">Неверная или устаревшая ссылка. Запросите сброс пароля снова.</p>
      )}
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
            readOnly={!!queryEmail}
          />
        </div>
        <div className="authPage__field">
          <label htmlFor="password" className="authPage__label">Новый пароль</label>
          <input
            id="password"
            type="password"
            className="authPage__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordRulesChecklist password={password} />
        </div>
        <div className="authPage__field">
          <label htmlFor="password_confirmation" className="authPage__label">Подтверждение пароля</label>
          <input
            id="password_confirmation"
            type="password"
            className="authPage__input"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordMatchHint password={password} confirmation={passwordConfirmation} />
        </div>
        <div className="authPage__actions">
          <button type="submit" className="authPage__submit" disabled={loading || noToken || !passwordReady}>
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
          <Link href="/auth/login" className="authPage__link">Вход</Link>
        </div>
      </form>
    </div>
  );
}
