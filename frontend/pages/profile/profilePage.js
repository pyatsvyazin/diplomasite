import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, getAvatarUrl, updateCurrentUser, requestPasswordChangeCode, confirmPasswordChange } from '../../lib/api';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../../lib/phone';
import ReviewForm from '../../components/profile/ReviewForm';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';

const STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'Рассматривается',
  in_progress: 'В работе',
  rejected: 'Отклонена',
  closed: 'Закрыта',
};

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
    </div>
  );
}

function ProfileCard({ user, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const roleLabel = user.roles?.length ? user.roles.map((r) => r.name).join(', ') : '—';

  return (
    <div className="profile-card">
      <div className="profile-card__banner" aria-hidden />
      <div className="profile-card__body">
      <Avatar name={user.full_name} size={112} className="profile-card__avatar" src={getAvatarUrl(user)} />
        <div className="profile-card__main">
          <h2 className="profile-card__name">{user.full_name || 'Фамилия Имя Отчество'}</h2>
          <ul className="profile-card__details">
            <li>Регистрация: {createdAt}</li>
            <li>Id: {user.id}</li>
            <li>Роль: {roleLabel}</li>
            <li>Телефон: {user.phone || '—'}</li>
            <li>Почта: {user.email || '—'}</li>
          </ul>
        </div>
        <div className="profile-card__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="profile-card__menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <span className="profile-card__menu-dots" aria-hidden>⋮</span>
          </button>
          {menuOpen && (
            <div className="profile-card__menu">
              <button type="button" className="profile-card__menu-item" onClick={() => { setMenuOpen(false); onEdit(); }}>
                Редактировать
              </button>
            </div>
          )}
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

function ProfileEditModal({ user, onClose, onSaved }) {
  const initialEmail = user?.email ?? '';
  const initialPhone = normalizeDigits(user?.phone ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [currentPassword, setCurrentPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [pwStep, setPwStep] = useState(null);
  const [pwCode, setPwCode] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwNewConfirm, setPwNewConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const emailOrPhoneChanged = email !== initialEmail || parsePhoneToDigits(phone) !== parsePhoneToDigits(initialPhone);
  const needCurrentPassword = emailOrPhoneChanged;

  const handlePhoneChange = (value) => {
    setPhone(normalizeDigits(value));
    setPhoneError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    if (!isValidPhoneDigits(phone)) {
      setPhoneError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    if (needCurrentPassword && !currentPassword.trim()) {
      setError('Для смены email или телефона введите текущий пароль.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: fullName,
        email: email || undefined,
        phone: parsePhoneToDigits(phone),
      };
      if (needCurrentPassword) payload.current_password = currentPassword;
      await updateCurrentUser(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordCode = async () => {
    setPwError('');
    setPwLoading(true);
    try {
      await requestPasswordChangeCode();
      setPwStep('requested');
    } catch (err) {
      setPwError(err.message || 'Не удалось отправить код');
    } finally {
      setPwLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    const err = validatePassword(pwNew);
    if (err) {
      setPwError(err);
      return;
    }
    if (pwNew !== pwNewConfirm) {
      setPwError('Пароли не совпадают');
      return;
    }
    setPwLoading(true);
    try {
      await confirmPasswordChange({
        code: pwCode.trim(),
        password: pwNew,
        password_confirmation: pwNewConfirm,
      });
      setPwStep(null);
      setPwCode('');
      setPwNew('');
      setPwNewConfirm('');
    } catch (err) {
      setPwError(err.message || 'Не удалось сменить пароль');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose} role="presentation">
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__head">
          <h3 className="profile-modal__title">Редактирование профиля</h3>
          <button type="button" className="profile-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form className="profile-modal__form" onSubmit={handleSubmit}>
          {error && <p className="profile-modal__error">{error}</p>}
          <label className="profile-modal__label">
            ФИО
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="profile-modal__input" required />
          </label>
          <label className="profile-modal__label">
            Почта
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="profile-modal__input" required />
          </label>
          <label className="profile-modal__label">
            Телефон
            <input
              type="tel"
              value={formatPhone(phone)}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="profile-modal__input"
              placeholder="+7 (9XX) XXX-XX-XX"
              required
            />
            {phoneError && <span className="profile-modal__error-inline">{phoneError}</span>}
          </label>
          {needCurrentPassword && (
            <label className="profile-modal__label">
              Текущий пароль (нужен для смены email или телефона)
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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

        <div className="profile-modal__section">
          <h4 className="profile-modal__subtitle">Сменить пароль</h4>
          {pwStep !== 'requested' ? (
            <>
              <p className="profile-modal__text">Код подтверждения придёт на вашу почту.</p>
              <button
                type="button"
                className="profile-modal__btn profile-modal__btn--secondary"
                onClick={handleRequestPasswordCode}
                disabled={pwLoading}
              >
                {pwLoading ? 'Отправка…' : 'Отправить код на почту'}
              </button>
            </>
          ) : (
            <form onSubmit={handleConfirmPasswordChange} className="profile-modal__form">
              {pwError && <p className="profile-modal__error">{pwError}</p>}
              <label className="profile-modal__label">
                Код из письма
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pwCode}
                  onChange={(e) => setPwCode(e.target.value.replace(/\D/g, ''))}
                  className="profile-modal__input"
                  placeholder="000000"
                />
              </label>
              <label className="profile-modal__label">
                Новый пароль
                <input
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="profile-modal__input"
                  placeholder="Минимум 8 символов, цифра и спецсимвол"
                />
              </label>
              <label className="profile-modal__label">
                Подтверждение пароля
                <input
                  type="password"
                  value={pwNewConfirm}
                  onChange={(e) => setPwNewConfirm(e.target.value)}
                  className="profile-modal__input"
                />
              </label>
              <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={pwLoading}>
                {pwLoading ? 'Сохранение…' : 'Сохранить новый пароль'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    if (!user) return;
    setRequestsLoading(true);
    getMyRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    load();
  }, [user?.id]);

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
    <div className="page">
      <section className="profile-card-section">
        <ProfileCard user={user} onEdit={() => setEditOpen(true)} />
        {editOpen && (
          <ProfileEditModal user={user} onClose={() => setEditOpen(false)} onSaved={() => refreshUser?.()} />
        )}
      </section>

      <section className="profile-requests">
        <h2 className="profile-requests__title">Мои заявки</h2>
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
      </section>
    </div>
  );
}
