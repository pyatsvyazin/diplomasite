import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import StarRating from '../StarRating';
import { getPublicStaff } from '../../lib/api';

const GAP = 16;

function ArrowIcon({ flipped }) {
  return (
    <svg
      className={`staff-section__arrow-svg${flipped ? ' staff-section__arrow-svg--flip' : ''}`}
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

function formatRatingNum(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return String(v).replace('.', ',');
}

function StaffBadges({ member }) {
  return (
    <div className="staff-section__badges">
      {member.success_rate != null ? (
        <span className="staff-section__badge">{member.success_rate}% выигранных дел</span>
      ) : null}
      {member.closed_cases_count > 0 ? (
        <span className="staff-section__badge">Закрытых дел: {member.closed_cases_count}</span>
      ) : null}
      {(member.specialties || []).map((s) => (
        <span key={s.id} className="staff-section__badge">
          {s.name}
        </span>
      ))}
    </div>
  );
}

export default function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const perView = usePerView();
  const wrapRef = useRef(null);
  const sliderRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const [cardWidth, setCardWidth] = useState(260);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getPublicStaff()
      .then((list) => {
        if (!cancelled) setStaff(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Не удалось загрузить данные');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const el = sliderRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      el.style.paddingRight = '0px';
      void el.offsetWidth;
      /** rect и clientWidth иногда расходятся на 1px; −1 — запас от «хвоста» 5-й карточки при 100% zoom после F5 */
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

    /** Два rAF: после первого прогона иногда ширина ещё «не устаканилась» (шрифты, grid). Смена zoom вручную даёт reflow — то же самое делаем программно */
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
  }, [perView, staff.length]);

  const maxIndex = useMemo(() => Math.max(0, staff.length - perView), [staff.length, perView]);

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

  /** Высота трека только по видимым карточкам — flex-ряд тянул бы высоту по max всего списка */
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || staff.length === 0) return undefined;

    const measureVisibleHeight = () => {
      const pv = Math.max(1, perView);
      const start = index;
      const end = Math.min(index + pv - 1, staff.length - 1);
      let maxH = 0;
      for (let i = start; i <= end; i++) {
        const el = cardRefs.current[i];
        if (el) {
          maxH = Math.max(maxH, el.getBoundingClientRect().height);
        }
      }
      if (maxH > 0) {
        track.style.height = `${Math.ceil(maxH)}px`;
      }
    };

    const scheduleMeasure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureVisibleHeight);
      });
    };

    measureVisibleHeight();
    scheduleMeasure();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => scheduleMeasure());
      ro.observe(track);
    }

    const t = window.setTimeout(() => scheduleMeasure(), 50);

    return () => {
      window.clearTimeout(t);
      if (ro) ro.disconnect();
      if (trackRef.current) {
        trackRef.current.style.height = '';
      }
    };
  }, [index, perView, cardWidth, staff.length]);

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
      <section className="block-section staff-section">
        <div className="staff-section__inner">
          <h2 className="staff-section__title">Наши сотрудники</h2>
          <p className="staff-section__hint">Загрузка…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="block-section staff-section">
        <div className="staff-section__inner">
          <h2 className="staff-section__title">Наши сотрудники</h2>
          <p className="staff-section__hint staff-section__hint--error">{error}</p>
        </div>
      </section>
    );
  }

  if (staff.length === 0) {
    return null;
  }

  const cwPx = `${cardWidth}px`;
  const step = cardWidth + GAP;
  const trackWidthPx =
    staff.length > 0 ? staff.length * cardWidth + (staff.length - 1) * GAP : 0;

  return (
    <section className="block-section staff-section">
      <div className="staff-section__inner">
        <h2 className="staff-section__title">Наши сотрудники</h2>

        <div className="staff-section__slider-wrap" ref={wrapRef}>
          <button
            type="button"
            className="staff-section__arrow staff-section__arrow--prev"
            onClick={goPrev}
            disabled={atStart}
            aria-label="Предыдущие"
          >
            <ArrowIcon flipped={false} />
          </button>

          <div className="staff-section__slider" ref={sliderRef}>
            <div
              className="staff-section__track"
              ref={trackRef}
              style={trackWidthPx ? { width: `${trackWidthPx}px` } : undefined}
            >
              {staff.map((m, i) => (
                <article
                  key={m.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="staff-section__card"
                  style={{
                    position: 'absolute',
                    left: `${i * step}px`,
                    top: 0,
                    width: cwPx,
                    minWidth: cwPx,
                    maxWidth: cwPx,
                    zIndex: staff.length - i,
                  }}
                >
                  <div className="staff-section__photo-wrap">
                    <img src={m.avatar_path} alt="" className="staff-section__photo" loading="lazy" />
                  </div>
                  <h3 className="staff-section__name">{m.full_name}</h3>

                  <div className="staff-section__rating-row">
                    <span className="staff-section__rating-label">Общий рейтинг:</span>
                    {m.rating != null ? (
                      <>
                        <span className="staff-section__stars-wrap">
                          <StarRating value={m.rating} size="1rem" />
                        </span>
                        <span className="staff-section__rating-num">{formatRatingNum(m.rating)}</span>
                      </>
                    ) : (
                      <span className="staff-section__rating-empty">нет оценок</span>
                    )}
                  </div>

                  <StaffBadges member={m} />
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="staff-section__arrow staff-section__arrow--next"
            onClick={goNext}
            disabled={atEnd}
            aria-label="Следующие"
          >
            <ArrowIcon flipped />
          </button>
        </div>
      </div>
    </section>
  );
}
