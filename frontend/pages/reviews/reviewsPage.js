import { useState, useEffect } from 'react';
import { getReviews, getReviewLawyers, getAvatarUrl } from '../../lib/api';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import LawyerFilterCombobox from '../../components/reviews/LawyerFilterCombobox';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [lawyerId, setLawyerId] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(true);

  useEffect(() => {
    getReviewLawyers()
      .then(setLawyers)
      .catch(() => setLawyers([]))
      .finally(() => setLawyersLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sort };
    if (lawyerId) params.lawyerId = lawyerId;
    getReviews(params)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [lawyerId, sort]);

  return (
    <div className="page reviews-page">
      <h1>Отзывы</h1>
      <div className="reviews-page__toolbar">
        <label className="reviews-page__field">
          <span className="reviews-page__label">Юрист</span>
          <LawyerFilterCombobox
            lawyers={lawyers}
            value={lawyerId}
            onChange={setLawyerId}
            disabled={lawyersLoading}
          />
        </label>
        <label className="reviews-page__field">
          <span className="reviews-page__label">Сортировка</span>
          <select
            className="reviews-page__select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Сначала новые (по дате)</option>
            <option value="rating_asc">По оценке: от низкой к высокой</option>
            <option value="rating_desc">По оценке: от высокой к низкой</option>
          </select>
        </label>
      </div>
      {loading ? (
        <p>Загрузка отзывов...</p>
      ) : reviews.length === 0 ? (
        <p>Пока нет отзывов{lawyerId ? ' по выбранному юристу' : ''}.</p>
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
