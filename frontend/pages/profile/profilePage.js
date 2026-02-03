import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests } from '../../lib/api';

const STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'Рассматривается',
  in_progress: 'В работе',
  rejected: 'Отклонена',
  closed: 'Закрыта',
};

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

function ProfileRequestCard({ request, currentUserId }) {
  const isClient = request.client_id === currentUserId;
  const other = isClient ? request.lawyer : request.client;
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
      <p className="profile-request-card__message">{request.message || '—'}</p>
      {other && (
        <div className="profile-request-card__other">
          {isClient ? 'Юрист: ' : 'Клиент: '}
          <span className="profile-request-card__other-name">{other.full_name}</span>
          {other.email && <span className="profile-request-card__other-email"> ({other.email})</span>}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    setRequestsLoading(true);
    getMyRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));
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
      <h1>Профиль</h1>
      <div className="profile-card">
        <span className="profile-card__avatar" aria-hidden>
          {getInitials(user.full_name)}
        </span>
        <div>
          <p><strong>ФИО:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {user.phone && <p><strong>Телефон:</strong> {user.phone}</p>}
          {user.roles?.length > 0 && (
            <p><strong>Роль:</strong> {user.roles.map((r) => r.name).join(', ')}</p>
          )}
        </div>
      </div>

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
                <ProfileRequestCard request={r} currentUserId={user.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}