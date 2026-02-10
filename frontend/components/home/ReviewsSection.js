import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getReviews } from '../../lib/api';
import StarRating from '../StarRating';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';

const CARD_WIDTH = 320;
const GAP = 20;

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);
  const transitionRef = useRef(true);

  useEffect(() => {
    getReviews()
      .then((list) => setReviews(list.slice(0, 10)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reviews.length > 0 && index === 0) setIndex(reviews.length);
  }, [reviews.length]);

  const list = reviews.length === 0 ? [] : [...reviews, ...reviews, ...reviews];
  const total = list.length;
  const n = reviews.length;

  const goPrev = () => {
    if (total === 0) return;
    if (index <= n) {
      transitionRef.current = false;
      setIndex(2 * n - 1);
      requestAnimationFrame(() => { transitionRef.current = true; });
    } else {
      setIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    if (total === 0) return;
    if (index >= 2 * n - 1) {
      transitionRef.current = false;
      setIndex(n);
      requestAnimationFrame(() => { transitionRef.current = true; });
    } else {
      setIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    if (!trackRef.current || total === 0) return;
    const offset = -(index * (CARD_WIDTH + GAP));
    trackRef.current.style.transition = transitionRef.current ? 'transform 0.3s ease' : 'none';
    trackRef.current.style.transform = `translateX(${offset}px)`;
  }, [index, total]);

  if (loading) {
    return (
      <section className="reviews-section">
        <div className="reviews-section__inner">
          <h2 className="reviews-section__title">Отзывы клиентов</h2>
          <p className="reviews-section__loading">Загрузка отзывов...</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="reviews-section">
        <div className="block-section reviews-section__inner">
          <h2 className="reviews-section__title">Отзывы клиентов</h2>
          <p className="reviews-section__empty">Пока нет отзывов.</p>
          <Link href="/reviews" className="reviews-section__more">
            Больше отзывов
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="reviews-section">
      <div className="reviews-section__inner">
        <h2 className="reviews-section__title">Отзывы клиентов</h2>
        <div className="reviews-section__slider-wrap">
          <button
            type="button"
            className="reviews-section__arrow reviews-section__arrow--prev"
            onClick={goPrev}
            aria-label="Предыдущий"
          >
            ‹
          </button>
          <div className="reviews-section__slider">
            <div className="reviews-section__track" ref={trackRef}>
              {list.map((r, i) => (
                <div key={`${r.id}-${i}`} className="reviews-section__card">
                  <div className="reviews-section__card-head">
                    <span className="reviews-section__card-author">
                      {r.is_anonymous ? 'Анонимно' : (r.client_name || 'Клиент')}
                    </span>
                    <span className="reviews-section__card-date">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', { dateStyle: 'long' }) : ''}
                    </span>
                  </div>
                  <div className="reviews-section__rating">
                    <StarRating value={r.rating} size="1rem" />
                  </div>
                  <p className="reviews-section__card-message">{r.message || '—'}</p>
                  {r.lawyer && (
                    <div className="reviews-section__card-lawyer">
                      <Avatar name={r.lawyer.full_name} size={36} src={getAvatarUrl(r.lawyer)} />
                      <span className="reviews-section__card-lawyer-name">{r.lawyer.full_name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="reviews-section__arrow reviews-section__arrow--next"
            onClick={goNext}
            aria-label="Следующий"
          >
            ›
          </button>
        </div>
        <div className="reviews-section__more-wrap">
          <Link href="/reviews" className="reviews-section__more">
            Больше отзывов
          </Link>
        </div>
      </div>
    </section>
  );
}