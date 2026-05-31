import { useEffect, useState } from 'react';
import { createAdminUser } from '../../lib/api';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../../lib/phone';
import { isPasswordPairReady } from '../../lib/validation';
import ModalShell from '../ModalShell';
import PasswordRulesChecklist from '../PasswordRulesChecklist';
import PasswordMatchHint from '../PasswordMatchHint';

export default function AdminCreateUserModal({ open, onClose, onCreated }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (!open) {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setPasswordConfirmation('');
      setRole('client');
      setError('');
      setPhoneError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneError('');

    if (!isValidPhoneDigits(phone)) {
      setPhoneError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    if (!isPasswordPairReady(password, passwordConfirmation)) {
      return;
    }

    setLoading(true);
    try {
      await createAdminUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: parsePhoneToDigits(phone),
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Ошибка создания пользователя');
    } finally {
      setLoading(false);
    }
  };

  const passwordReady = isPasswordPairReady(password, passwordConfirmation);

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="staff-modal staff-modal--wide" role="dialog">
        <button type="button" className="staff-modal__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 className="staff-modal__title">Регистрация пользователя</h2>
        <form onSubmit={handleSubmit} className="staff-modal__form">
          <label className="staff-modal__label">
            ФИО
            <input className="staff-modal__input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="staff-modal__label">
            Email
            <input className="staff-modal__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="staff-modal__label">
            Телефон
            <input
              className="staff-modal__input"
              type="tel"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(normalizeDigits(e.target.value))}
              required
            />
            {phoneError && <span className="staff-modal__error">{phoneError}</span>}
          </label>
          <label className="staff-modal__label">
            Пароль
            <input
              className="staff-modal__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <PasswordRulesChecklist password={password} />
          </label>
          <label className="staff-modal__label">
            Подтверждение пароля
            <input
              className="staff-modal__input"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
            />
            <PasswordMatchHint password={password} confirmation={passwordConfirmation} />
          </label>
          <label className="staff-modal__label">
            Роль
            <select className="staff-modal__input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Клиент</option>
              <option value="lawyer">Юрист</option>
              <option value="admin">Администратор</option>
            </select>
          </label>

          {error && <p className="staff-modal__error">{error}</p>}

          <div className="staff-modal__actions">
            <button type="button" className="staff-modal__btn staff-modal__btn--secondary" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="staff-modal__btn staff-modal__btn--primary" disabled={loading || !passwordReady}>
              {loading ? '…' : 'Зарегистрировать'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
