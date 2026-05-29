import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { update2faSetting } from '../../lib/api';

export default function SettingsTabContent() {
  const { user, refreshUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const twoFactorEnabled = user?.two_factor_enabled !== false;

  const handleToggleClick = (newValue) => {
    setPendingValue(newValue);
    setPassword('');
    setError('');
    setModalOpen(true);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (pendingValue === null) return;
    setError('');
    if (!password.trim()) {
      setError('Введите пароль для подтверждения.');
      return;
    }
    setLoading(true);
    try {
      await update2faSetting(pendingValue, password);
      refreshUser?.();
      setModalOpen(false);
      setPendingValue(null);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Не удалось изменить настройку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="profile-dashboard__section-title">Настройки</h2>
      <section className="settings-section">
        <h3 className="settings-section__title">Безопасность</h3>
        <div className="settings-row">
          <div className="settings-row__label">
            <span className="settings-row__name">Код на почту при входе</span>
            <span className="settings-row__hint">
              Двухфакторная аутентификация: при включении после ввода пароля будет отправляться код на email
            </span>
          </div>
          <div className="settings-row__control">
            <button
              type="button"
              className={`settings-toggle ${twoFactorEnabled ? 'settings-toggle--on' : 'settings-toggle--off'}`}
              onClick={() => handleToggleClick(!twoFactorEnabled)}
              aria-pressed={twoFactorEnabled}
            >
              <span className="settings-toggle__thumb" />
            </button>
          </div>
        </div>
      </section>
      {modalOpen && (
        <div className="profile-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="profile-modal profile-modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal__head">
              <h3 className="profile-modal__title">Подтверждение</h3>
              <button type="button" className="profile-modal__close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form className="profile-modal__form" onSubmit={handleConfirm}>
              {error && <p className="profile-modal__error">{error}</p>}
              <p className="profile-modal__text">
                {pendingValue ? 'Включить код на почту при входе?' : 'Выключить код на почту при входе?'}
              </p>
              <label className="profile-modal__label">
                Пароль
                <input
                  type="password"
                  className="profile-modal__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <div className="profile-modal__actions">
                <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={() => setModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={loading}>
                  {loading ? '…' : 'Подтвердить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
