import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getReviews, getAvatarUrl } from '../../lib/api';
import StarRating from '../StarRating';
import Avatar from '../Avatar';

const GAP = 16;

function ArrowIcon({ flipped }) {
  return (
    <svg
      className={`reviews-section__arrow-svg${flipped ? ' reviews-section__arrow-svg--flip' : ''}`}
      width="17"
      height="30"
      viewBox="0 0 17 30"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0.585786 13.3137C-0.195262 14.0947 -0.195262 15.3611 0.585786 16.1421L13.3137 28.87C14.0948 29.6511 15.3611 29.6511 16.1421 28.87C16.9232 28.089 16.9232 26.8227 16.1421 26.0416L4.82843 14.7279L16.1421 3.4142C16.9232 2.63315 16.9232 1.36682 16.1421 0.585771C15.3611 -0.195278 14.0948 -0.195278 13.3137 0.585771L0.585786 13.3137ZM3 14.7279L3 12.7279L2 12.7279L2 14.7279L2 16.7279L3 16.7279L3 14.7279Z"
      />
    </svg>
  );
}

function usePerView() {
  const [n, setN] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w < 560) setN(1);
      else if (w < 768) setN(2);
      else if (w < 1100) setN(3);
      else setN(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return n;
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const perView = usePerView();
  const wrapRef = useRef(null);
  const sliderRef = useRef(null);
  const trackRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(260);

  useEffect(() => {
    getReviews()
      .then((list) => setReviews(Array.isArray(list) ? list.slice(0, 10) : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useLayoutEffect(() => {
    const el = sliderRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      el.style.paddingRight = '0px';
      void el.offsetWidth;
      const rectW = Math.floor(el.getBoundingClientRect().width);
      const clientW = Math.floor(el.clientWidth);
      const w = Math.max(0, Math.min(rectW, clientW) - 1);
      const pv = Math.max(1, perView);
      const totalGaps = (pv - 1) * GAP;
      const cw = Math.floor((w - totalGaps) / pv);
      const used = pv * cw + totalGaps;
      const slack = Math.max(0, w - used);
      el.style.paddingRight = slack > 0 ? `${slack}px` : '0px';
      setCardWidth(Math.max(160, cw));
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(update);
      });
    };

    update();
    scheduleUpdate();

    const ro = new ResizeObserver(() => scheduleUpdate());
    ro.observe(el);
    const wrap = wrapRef.current;
    if (wrap) {
      ro.observe(wrap);
    }

    const onResize = () => scheduleUpdate();
    window.addEventListener('resize', onResize);
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (vv) {
      vv.addEventListener('resize', onResize);
    }

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) scheduleUpdate();
      });
    }

    const t1 = window.setTimeout(() => {
      if (!cancelled) scheduleUpdate();
    }, 50);
    const t2 = window.setTimeout(() => {
      if (!cancelled) scheduleUpdate();
    }, 300);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (vv) {
        vv.removeEventListener('resize', onResize);
      }
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      const node = sliderRef.current;
      if (node) {
        node.style.paddingRight = '';
      }
    };
  }, [perView, reviews.length]);

  const maxIndex = useMemo(() => Math.max(0, reviews.length - perView), [reviews.length, perView]);

  useEffect(() => {
    setIndex((i) => Math.min(Math.max(0, i), maxIndex));
  }, [maxIndex]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !sliderRef.current) return;
    const step = cardWidth + GAP;
    const x = -index * step;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    track.style.transition = 'transform 0.3s ease';
  }, [index, cardWidth]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  const atStart = index <= 0;
  const atEnd = index >= maxIndex;

  if (loading) {
    return (
      <section className="reviews-section">
        <div className="block-section reviews-section__inner">
          <h2 className="reviews-section__title">Отзывы клиентов</h2>
          <div className="reviews-section__skeleton-row">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="reviews-section__skeleton-card" aria-hidden>
                <div className="reviews-section__skeleton-stars shimmer" />
                <div className="reviews-section__skeleton-line shimmer" />
                <div className="reviews-section__skeleton-line shimmer" />
                <div className="reviews-section__skeleton-line shimmer reviews-section__skeleton-line--short" />
              </div>
            ))}
          </div>
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

  const cwPx = `${cardWidth}px`;

  return (
    <section className="reviews-section">
      <div className="reviews-section__inner">
        <h2 className="reviews-section__title">Отзывы клиентов</h2>
        <div className="reviews-section__slider-wrap" ref={wrapRef}>
          <button
            type="button"
            className="reviews-section__arrow reviews-section__arrow--prev"
            onClick={goPrev}
            disabled={atStart}
            aria-label="Предыдущие отзывы"
          >
            <ArrowIcon flipped={false} />
          </button>

          <div className="reviews-section__slider" ref={sliderRef}>
            <div className="reviews-section__track" ref={trackRef}>
              {reviews.map((r, i) => (
                <div
                  key={r.id}
                  className="reviews-section__card"
                  style={{
                    flex: `0 0 ${cwPx}`,
                    width: cwPx,
                    minWidth: cwPx,
                    maxWidth: cwPx,
                    zIndex: reviews.length - i,
                  }}
                >
                  <div className="reviews-section__card-head">
                    <span className="reviews-section__card-author">
                      {r.is_anonymous ? 'Анонимно' : r.client_name || 'Клиент'}
                    </span>
                    <span className="reviews-section__card-date">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('ru-RU', { dateStyle: 'long' })
                        : ''}
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
            disabled={atEnd}
            aria-label="Следующие отзывы"
          >
            <ArrowIcon flipped />
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
