import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, getAvatarUrl, updateCurrentUser, requestPasswordChangeCode, confirmPasswordChange } from '../../lib/api';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../../lib/phone';
import { isPasswordPairReady } from '../../lib/validation';
import PasswordMatchHint from '../../components/PasswordMatchHint';
import { roleLabel } from '../../constants/userRoles';
import ReviewForm from '../../components/profile/ReviewForm';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import { REQUEST_STATUS_LABELS as STATUS_LABELS } from '../../constants/requestStatus';
import ProfileDashboardLayout from '../../components/profile/ProfileDashboardLayout';
import ConsultationsTab from '../../components/profile/ConsultationsTab';
import SettingsTabContent from '../../components/profile/SettingsTabContent';
import ModalShell from '../../components/ModalShell';
import PasswordRulesChecklist from '../../components/PasswordRulesChecklist';

function ProfileRequestCard({ request, currentUserId, onReviewSent }) {
  const isClient = request.client_id === currentUserId;
  const other = isClient ? request.lawyer : request.client;
  const review = request.review;
  const canLeaveReview = isClient && request.status === 'closed' && !review;
  const ratingDisplay = review && review.rating != null ? review.rating / 2 : 0;

  const createdAt = request.created_at
    ? new Date(request.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <div className="profile-request-card">
      <div className="profile-request-card__head">
        <span className="profile-request-card__date">{createdAt}</span>
        <span className={`profile-request-card__status profile-request-card__status--${request.status}`}>
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>
      {request.subject && (
        <p className="profile-request-card__subject">Тема: {request.subject}</p>
      )}
      <p className="profile-request-card__message">{request.message || '—'}</p>
      {other && (
        <div className="profile-request-card__person">
           <Avatar name={other.full_name} size={36} className="profile-request-card__person-avatar" src={getAvatarUrl(other)} />
          <div className="profile-request-card__person-info">
            <span className="profile-request-card__person-label">{isClient ? 'Юрист: ' : 'Клиент: '}</span>
            <span className="profile-request-card__person-name">{other.full_name}</span>
            {other.email && <span className="profile-request-card__person-email">{other.email}</span>}
          </div>
        </div>
      )}
      {canLeaveReview && (
        <div className="profile-request-card__review-section">
          <ReviewForm requestId={request.id} onSuccess={onReviewSent} />
        </div>
      )}
      {review && (
        <div className="profile-request-card__review">
          <StarRating value={ratingDisplay} />
          <p className="profile-request-card__review-message">{review.message}</p>
        </div>
      )}
      <div className="profile-request-card__actions">
        <Link href={`/requests/${request.id}/chat`} className="profile-request-card__chat-link">
          Открыть чат
        </Link>
      </div>
    </div>
  );
}

function ProfileCard({ user, onEditField, onChangePassword }) {
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const rolesText = user.roles?.length
    ? user.roles.map((r) => roleLabel(r.name)).join(', ')
    : '—';

  return (
    <div className="profile-card">
      <div className="profile-card__banner" aria-hidden />
      <button type="button" className="profile-card__menu-decor" aria-hidden title="">⋯</button>
      <div className="profile-card__body">
        <Avatar name={user.full_name} size={112} className="profile-card__avatar" src={getAvatarUrl(user)} />
        <div className="profile-card__main">
          <h2 className="profile-card__name">{user.full_name || 'ФИО'}</h2>
          <ul className="profile-card__details">
            <li className="profile-card__detail--static">Регистрация: {createdAt}</li>
            <li className="profile-card__detail--static">Id: {user.id}</li>
            <li className="profile-card__detail--static">Роль: {rolesText}</li>
            <li
              className="profile-card__detail--editable"
              onClick={() => onEditField('full_name')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('full_name')}
            >
              <span className="profile-card__detail-value">ФИО: {user.full_name || '—'}</span>
              <span className="profile-card__detail-hint">Нажмите, чтобы изменить</span>
            </li>
            <li
              className="profile-card__detail--editable"
              onClick={() => onEditField('phone')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('phone')}
            >
              <span className="profile-card__detail-value">Телефон: {user.phone ? formatPhone(user.phone) : '—'}</span>
              <span className="profile-card__detail-hint">Нажмите, чтобы изменить номер</span>
            </li>
            <li
              className="profile-card__detail--editable"
              onClick={() => onEditField('email')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('email')}
            >
              <span className="profile-card__detail-value">Почта: {user.email || '—'}</span>
              <span className="profile-card__detail-hint">Нажмите, чтобы изменить</span>
            </li>
          </ul>
          <button
            type="button"
            className="profile-card__change-pwd-btn"
            onClick={onChangePassword}
          >
            Сменить пароль
          </button>
        </div>
      </div>
    </div>
  );
}

function validatePassword(pwd) {
  if (pwd.length < 8) return 'Минимум 8 символов';
  if (!/[0-9]/.test(pwd)) return 'Нужна хотя бы одна цифра';
  if (!/[^\p{L}\p{N}\s]/u.test(pwd)) return 'Нужен хотя бы один спецсимвол';
  return '';
}

const FIELD_LABELS = { full_name: 'ФИО', email: 'Почта', phone: 'Телефон' };

function InlineEditModal({ field, user, onClose, onSaved }) {
  const isPhone = field === 'phone';
  const initial = field === 'phone' ? (user?.phone ? formatPhone(user.phone) : '') : (user?.[field] ?? '');
  const [value, setValue] = useState(initial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhoneChange = (v) => setValue(formatPhone(normalizeDigits(v)));

  const needPassword = field === 'email' || field === 'phone';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isPhone && !isValidPhoneDigits(value)) {
      setError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    if (needPassword && !password.trim()) {
      setError('Введите пароль для подтверждения.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || parsePhoneToDigits(''),
      };
      if (needPassword) payload.current_password = password;
      if (field === 'phone') payload.phone = parsePhoneToDigits(value);
      else payload[field] = value;
      await updateCurrentUser(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open onClose={onClose} overlayClassName="profile-modal-backdrop">
      <div
        className="profile-modal profile-modal--small"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-modal__head">
          <h3 className="profile-modal__title">Изменить {FIELD_LABELS[field]}</h3>
          <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form className="profile-modal__form" onSubmit={handleSubmit}>
          {error && <p className="profile-modal__error">{error}</p>}
          <label className="profile-modal__label">
            Новое значение
            {isPhone ? (
              <input
                type="tel"
                value={value}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="profile-modal__input"
                placeholder="+7 (9XX) XXX-XX-XX"
              />
            ) : (
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="profile-modal__input"
                required
              />
            )}
          </label>
          {needPassword && (
            <label className="profile-modal__label">
              Пароль (для подтверждения смены)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="profile-modal__input"
                placeholder="Введите пароль от аккаунта"
                required
              />
            </label>
          )}
          <div className="profile-modal__actions">
            <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

function PasswordChangeModal({ onClose }) {
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
      onClose();
    } catch (err) {
      setError(err.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell open onClose={onClose} overlayClassName="profile-modal-backdrop">
      <div className="profile-modal profile-modal--small">
        <div className="profile-modal__head">
          <h3 className="profile-modal__title">Сменить пароль</h3>
          <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {step === 'request' ? (
          <>
            <p className="profile-modal__text">Код подтверждения придёт на вашу почту.</p>
            {error && <p className="profile-modal__error">{error}</p>}
            <div className="profile-modal__actions">
              <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={onClose}>Отмена</button>
              <button type="button" className="profile-modal__btn profile-modal__btn--primary" onClick={handleRequestCode} disabled={loading}>
                {loading ? 'Отправка…' : 'Отправить код на почту'}
              </button>
            </div>
          </>
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
              <button
                type="submit"
                className="profile-modal__btn profile-modal__btn--primary"
                disabled={loading || !isPasswordPairReady(newPassword, newPasswordConfirm)}
              >
                {loading ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalShell>
  );
}

function ProfileRequestsTab({ user }) {
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const load = () => {
    if (!user) return;
    setRequestsLoading(true);
    getMyRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  return (
    <>
      <h2 className="profile-dashboard__section-title">Мои заявки</h2>
      {requestsLoading ? (
        <p className="profile-requests__loading">Загрузка заявок...</p>
      ) : requests.length === 0 ? (
        <p className="profile-requests__empty">Нет заявок</p>
      ) : (
        <ul className="profile-requests__list">
          {requests.map((r) => (
            <li key={r.id}>
              <ProfileRequestCard
                request={r}
                currentUserId={user.id}
                onReviewSent={load}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [editField, setEditField] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const tab = typeof router.query.tab === 'string' ? router.query.tab : 'requests';

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.tab;
    if (!q || q === 'notifications') {
      router.replace({ pathname: '/profile/profilePage', query: { tab: 'requests' } }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.tab]);

  if (loading) {
    return (
      <div className="page">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <p>Войдите в аккаунт, чтобы просмотреть профиль.</p>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <section className="profile-card-section">
        <ProfileCard
          user={user}
          onEditField={setEditField}
          onChangePassword={() => setPasswordModalOpen(true)}
        />
        {editField && (
          <InlineEditModal
            field={editField}
            user={user}
            onClose={() => setEditField(null)}
            onSaved={() => { refreshUser?.(); setEditField(null); }}
          />
        )}
        {passwordModalOpen && (
          <PasswordChangeModal onClose={() => setPasswordModalOpen(false)} />
        )}
      </section>

      <ProfileDashboardLayout activeTab={tab}>
        {tab === 'requests' && <ProfileRequestsTab user={user} />}
        {tab === 'consultations' && <ConsultationsTab />}
        {tab === 'settings' && <SettingsTabContent />}
      </ProfileDashboardLayout>
    </div>
  );
}
