import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, getAvatarUrl, updateCurrentUser, uploadUserAvatar } from '../../lib/api';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../../lib/phone';
import ReviewForm from '../../components/profile/ReviewForm';
import RequestChatLink from '../../components/RequestChatLink';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import { REQUEST_STATUS_LABELS as STATUS_LABELS } from '../../constants/requestStatus';
import ProfileDashboardLayout from '../../components/profile/ProfileDashboardLayout';
import ConsultationsTab from '../../components/profile/ConsultationsTab';
import SettingsTabContent from '../../components/profile/SettingsTabContent';
import ModalShell from '../../components/ModalShell';

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
    <div className="profile-request-card profile-request-card--with-chat">
      <RequestChatLink requestId={request.id} />
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

function ProfileCard({ user, onEditField, onAvatarChange, avatarUploading }) {
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <div className="profile-card">
      <div className="profile-card__banner" aria-hidden />
      <div className="profile-card__body">
        <div className="profile-card__avatar-wrap">
          <Avatar name={user.full_name} size={112} className="profile-card__avatar" src={getAvatarUrl(user)} />
          <label className="profile-card__avatar-edit" title="Изменить фото">
            <img src="/icons/edit.svg" alt="" width={14} height={14} className="profile-card__avatar-edit-icon" aria-hidden />
            <input
              type="file"
              accept="image/*"
              className="profile-card__avatar-input"
              disabled={avatarUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarChange?.(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="profile-card__main">
          <h2 className="profile-card__name">{user.full_name || 'ФИО'}</h2>
          <ul className="profile-card__details">
            <li className="profile-card__detail profile-card__detail--static">
              <img src="/icons/profile/calendar_1.svg" alt="" width={18} height={18} aria-hidden />
              <span>Регистрация: {createdAt}</span>
            </li>
            <li className="profile-card__detail profile-card__detail--static">
              <img src="/icons/profile/id_2.svg" alt="" width={18} height={18} aria-hidden />
              <span>Id: {user.id}</span>
            </li>
            <li
              className="profile-card__detail profile-card__detail--editable"
              onClick={() => onEditField('full_name')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('full_name')}
            >
              <img src="/icons/profile/use_3.svg" alt="" width={18} height={18} aria-hidden />
              <span className="profile-card__detail-text">
                <span className="profile-card__detail-value">ФИО: {user.full_name || '—'}</span>
                <span className="profile-card__detail-hint">Нажмите, чтобы изменить</span>
              </span>
            </li>
            <li
              className="profile-card__detail profile-card__detail--editable"
              onClick={() => onEditField('phone')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('phone')}
            >
              <img src="/icons/profile/phone_4.svg" alt="" width={18} height={18} aria-hidden />
              <span className="profile-card__detail-text">
                <span className="profile-card__detail-value">Телефон: {user.phone ? formatPhone(user.phone) : '—'}</span>
                <span className="profile-card__detail-hint">Нажмите, чтобы изменить</span>
              </span>
            </li>
            <li
              className="profile-card__detail profile-card__detail--editable"
              onClick={() => onEditField('email')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onEditField('email')}
            >
              <img src="/icons/profile/mail_5.svg" alt="" width={18} height={18} aria-hidden />
              <span className="profile-card__detail-text">
                <span className="profile-card__detail-value">Почта: {user.email || '—'}</span>
                <span className="profile-card__detail-hint">Нажмите, чтобы изменить</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
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
  const [avatarUploading, setAvatarUploading] = useState(false);

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
          avatarUploading={avatarUploading}
          onAvatarChange={async (file) => {
            setAvatarUploading(true);
            try {
              await uploadUserAvatar(file);
              refreshUser?.();
            } catch (e) {
              alert(e.message || 'Не удалось загрузить фото');
            } finally {
              setAvatarUploading(false);
            }
          }}
        />
        {editField && (
          <InlineEditModal
            field={editField}
            user={user}
            onClose={() => setEditField(null)}
            onSaved={() => { refreshUser?.(); setEditField(null); }}
          />
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
