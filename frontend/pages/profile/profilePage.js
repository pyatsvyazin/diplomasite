import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, getAvatarUrl, updateCurrentUser } from '../../lib/api';
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

function ProfileEditModal({ user, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateCurrentUser({ full_name: fullName, email: email || undefined, phone: phone || undefined });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
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
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="profile-modal__input" />
          </label>
          <div className="profile-modal__actions">
            <button type="button" className="profile-modal__btn profile-modal__btn--secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="profile-modal__btn profile-modal__btn--primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
          </div>
        </form>
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