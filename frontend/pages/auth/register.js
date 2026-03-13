import Link from 'next/link';
import { useRegister } from '../../hooks/useRegister';
import { formatPhone } from '../../lib/phone';

export default function RegisterPage() {
  const {
    form,
    updateField,
    error,
    passwordError,
    phoneError,
    loading,
    handleSubmit,
  } = useRegister();

  return (
    <div className="authPage">
      <h1 className="authPage__title">Регистрация</h1>
      <form className="authPage__form" onSubmit={handleSubmit}>
        {error && <p className="authPage__error">{error}</p>}
        <div className="authPage__field">
          <label htmlFor="full_name" className="authPage__label">ФИО</label>
          <input
            id="full_name"
            type="text"
            className="authPage__input"
            value={form.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="authPage__field">
          <label htmlFor="email" className="authPage__label">Email</label>
          <input
            id="email"
            type="email"
            className="authPage__input"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="authPage__field">
          <label htmlFor="phone" className="authPage__label">Телефон</label>
          <input
            id="phone"
            type="tel"
            className="authPage__input"
            value={formatPhone(form.phone)}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+7 (9XX) XXX-XX-XX"
            autoComplete="tel"
            required
          />
          {phoneError && <p className="authPage__error authPage__error--field">{phoneError}</p>}
        </div>
        <div className="authPage__field">
          <label htmlFor="password" className="authPage__label">Пароль</label>
          <input
            id="password"
            type="password"
            className="authPage__input"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="authPage__hint">Не менее 8 символов, минимум одна цифра и один спецсимвол (!@#$%^&* и т.д.)</p>
          {passwordError && <p className="authPage__error authPage__error--field">{passwordError}</p>}
        </div>
        <div className="authPage__field">
          <label htmlFor="password_confirmation" className="authPage__label">Подтверждение пароля</label>
          <input
            id="password_confirmation"
            type="password"
            className="authPage__input"
            value={form.password_confirmation}
            onChange={(e) => updateField('password_confirmation', e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="authPage__actions">
          <button type="submit" className="authPage__submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          <Link href="/auth/login" className="authPage__link">Вход</Link>
        </div>
      </form>
    </div>
  );
}
