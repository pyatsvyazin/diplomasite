import { useState, useEffect } from 'react';
import { getReviews } from '../../lib/api';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import { getAvatarUrl } from '../../lib/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Отзывы</h1>
      {loading ? (
        <p>Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <p>Пока нет отзывов.</p>
      ) : (
        <ul className="reviews-list">
          {reviews.map((r) => (
            <li key={r.id} className="reviews-list__item">
              <div className="reviews-list__head">
                <span className="reviews-list__author">
                  {r.is_anonymous ? 'Анонимно' : (r.client_name || 'Клиент')}
                </span>
                <span className="reviews-list__date">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', { dateStyle: 'long' }) : ''}
                </span>
              </div>
              <div className="reviews-list__rating">
                <StarRating value={r.rating} />
              </div>
              <p className="reviews-list__message">{r.message}</p>
              {r.lawyer && (
                <div className="reviews-list__lawyer">
                  <Avatar name={r.lawyer.full_name} size={36} className="reviews-list__lawyer-avatar" src={getAvatarUrl(r.lawyer)} />
                  <span className="reviews-list__lawyer-name">{r.lawyer.full_name}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
