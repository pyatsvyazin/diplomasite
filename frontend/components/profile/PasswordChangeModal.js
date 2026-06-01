import { useState } from 'react';
import { requestPasswordChangeCode, confirmPasswordChange } from '../../lib/api';
import { isPasswordPairReady } from '../../lib/validation';
import PasswordRulesChecklist from '../PasswordRulesChecklist';
import PasswordMatchHint from '../PasswordMatchHint';
import ModalShell from '../ModalShell';

export default function PasswordChangeModal({ open, onClose }) {
  const [step, setStep] = useState('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    setError('');
    setLoading(true);
    try {
      await requestPasswordChangeCode();
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordPairReady(newPassword, newPasswordConfirm)) {
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordChange({
        code: code.trim(),
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      });
      onClose?.();
      setStep('request');
      setCode('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setError(err.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell open onClose={onClose} overlayClassName="profile-modal-backdrop">
      <div className="profile-modal profile-modal--small">
        <div className="profile-modal__head">
          <h3 className="profile-modal__title">Сменить пароль</h3>
          <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {step === 'request' ? (
          <div className="profile-modal__body">
            <p className="profile-modal__text">Код подтверждения придёт на вашу почту.</p>
            {error && <p className="profile-modal__error">{error}</p>}
            <div className="profile-modal__actions">
              <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="button" className="profile-modal__btn profile-modal__btn--primary" onClick={handleRequestCode} disabled={loading}>
                {loading ? 'Отправка…' : 'Отправить код'}
              </button>
            </div>
          </div>
        ) : (
          <form className="profile-modal__form" onSubmit={handleConfirm}>
            {error && <p className="profile-modal__error">{error}</p>}
            <label className="profile-modal__label">
              Код из письма
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="profile-modal__input" placeholder="000000" />
            </label>
            <label className="profile-modal__label">
              Новый пароль
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="profile-modal__input" />
              <PasswordRulesChecklist password={newPassword} />
            </label>
            <label className="profile-modal__label">
              Подтверждение пароля
              <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className="profile-modal__input" />
              <PasswordMatchHint password={newPassword} confirmation={newPasswordConfirm} />
            </label>
            <div className="profile-modal__actions">
              <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={onClose}>Отмена</button>
              <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={loading || !isPasswordPairReady(newPassword, newPasswordConfirm)}>
                {loading ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalShell>
  );
}
