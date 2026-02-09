import { useState, useRef } from 'react';
import { createReview } from '../../lib/api';
import StarRating from '../StarRating';

export default function ReviewForm({ requestId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverValue, setHoverValue] = useState(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const starsRef = useRef(null);

  const displayValue = hoverValue !== null ? hoverValue : rating;

  const getValueFromPosition = (clientX) => {
    const el = starsRef.current;
    if (!el) return 0.5;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const w = rect.width;
    if (x <= 0) return 0.5;
    if (x >= w) return 5;
    const p = x / w;
    const raw = 0.5 + p * 4.5;
    const rounded = Math.round(raw * 2) / 2;
    return Math.min(5, Math.max(0.5, rounded));
  };

  const handleMouseMove = (e) => {
    setHoverValue(getValueFromPosition(e.clientX));
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleClick = (e) => {
    const v = getValueFromPosition(e.clientX);
    setRating(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 0.5) {
      setError('Выберите оценку.');
      return;
    }
    setError('');
    setLoading(true);
    createReview({
      request_id: requestId,
      rating,
      message: message.trim(),
      is_anonymous: isAnonymous,
    })
      .then(() => onSuccess())
      .catch((err) => setError(err.message || 'Ошибка отправки'))
      .finally(() => setLoading(false));
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form__rating">
        <span className="review-form__rating-label">Оценка:</span>
        <div
          ref={starsRef}
          className="review-form__stars review-form__stars--interactive"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          role="slider"
          aria-valuenow={rating}
          aria-valuemin={0.5}
          aria-valuemax={5}
          aria-label="Оценка от 0.5 до 5"
          tabIndex={0}
        >
          <StarRating value={displayValue} size="1.5rem" readonly />
        </div>
        <span className="review-form__rating-value">{displayValue ? `${displayValue} / 5` : '—'}</span>
      </div>
      <label className="review-form__label">
        Отзыв
        <textarea
          className="review-form__textarea"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      <label className="review-form__checkbox">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        Опубликовать анонимно
      </label>
      {error && <p className="review-form__error">{error}</p>}
      <button type="submit" className="review-form__submit" disabled={loading}>
        {loading ? 'Отправка…' : 'Отправить отзыв'}
      </button>
    </form>
  );
}