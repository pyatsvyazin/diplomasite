import Link from 'next/link';
import { useLogin } from '../../hooks/useLogin';

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  } = useLogin();

  return (
    <div className="authPage-shell">
      <div className="authPage">
        <h1 className="authPage__title">Вход</h1>
        <p className="authPage__subtitle">Войдите в личный кабинет</p>
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
        <div className="authPage__field">
          <label htmlFor="password" className="authPage__label">Пароль</label>
          <input
            id="password"
            type="password"
            className="authPage__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="authPage__actions">
          <button type="submit" className="authPage__submit" disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </button>
          <div className="authPage__links">
            <Link href="/auth/register" className="authPage__link">Регистрация</Link>
            <Link href="/auth/forgot-password" className="authPage__link">Забыли пароль?</Link>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
