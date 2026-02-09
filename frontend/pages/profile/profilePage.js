import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests } from '../../lib/api';
import ReviewForm from '../../components/profile/ReviewForm';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import { getAvatarUrl } from '../../lib/api';

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

export default function ProfilePage() {
  const { user, loading } = useAuth();
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
      <h1>Профиль</h1>
      <div className="profile-card">
        <Avatar name={user.full_name} size="lg" className="profile-card__avatar" src={getAvatarUrl(user)} />
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