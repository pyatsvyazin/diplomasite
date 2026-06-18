import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SERVICE_CATEGORY_BUSINESS, SERVICE_CATEGORY_INDIVIDUALS } from '../../constants/serviceCategories';
import { getServices } from '../../lib/api';

const LIST_HREF = {
  individuals: '/services/individuals',
  business: '/services/business',
};

/** Пороги ширины окна → лимит карточек, колонки, кнопка «все» в сетке или снизу */
function getGridTier(width) {
  if (width >= 1311) return { limit: 9, cols: 3, morePlacement: 'replace', skeleton: 9 };
  if (width >= 1001) return { limit: 6, cols: 3, morePlacement: 'replace', skeleton: 6 };
  if (width >= 901) return { limit: 4, cols: 2, morePlacement: 'replace', skeleton: 4 };
  if (width >= 851) return { limit: 9, cols: 3, morePlacement: 'below', skeleton: 9 };
  if (width >= 561) return { limit: 6, cols: 2, morePlacement: 'below', skeleton: 6 };
  return { limit: 4, cols: 1, morePlacement: 'below', skeleton: 4 };
}

function useGridTier() {
  const defaultWidth = 1400;
  const [tier, setTier] = useState(() => getGridTier(defaultWidth));

  useEffect(() => {
    const update = () => setTier(getGridTier(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return tier;
}

function ServiceCard({ service }) {
  return (
    <article className="services-section__card">
      <Link href={`/services/${service.id}`} className="services-section__card-link">
        <div className="services-section__card-head">
          <h3 className="services-section__card-title">{service.name}</h3>
          <span className="services-section__arrow-icon" aria-hidden>
            ›
          </span>
        </div>
        {service.short_description ? (
          <p className="services-section__card-desc">{service.short_description}</p>
        ) : null}
        <span className="services-section__price">{service.formatted_price}</span>
      </Link>
    </article>
  );
}

function ServicesMoreCard({ href }) {
  return (
    <article className="services-section__card services-section__card--more">
      <Link href={href} className="services-section__card-link services-section__more-link">
        <span className="services-section__more-label">Все услуги</span>
        <span className="services-section__more-arrow" aria-hidden>
          →
        </span>
      </Link>
    </article>
  );
}

function ServicesMoreButton({ href }) {
  return (
    <div className="services-section__more-row">
      <Link href={href} className="services-section__more-btn">
        Все услуги
      </Link>
    </div>
  );
}

function ServicesGrid({ services, tier, listHref }) {
  const hasMore = services.length > tier.limit;
  const replaceSlot = tier.morePlacement === 'replace' && hasMore;
  const showBelow = tier.morePlacement === 'below' && hasMore;
  const visibleCount = replaceSlot ? tier.limit - 1 : Math.min(services.length, tier.limit);
  const visible = services.slice(0, visibleCount);

  return (
    <>
      <div className={`services-section__grid services-section__grid--cols-${tier.cols}`}>
        {visible.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
        {replaceSlot && <ServicesMoreCard href={listHref} />}
      </div>
      {showBelow && <ServicesMoreButton href={listHref} />}
    </>
  );
}

function ServicesGridSkeleton({ tier }) {
  return (
    <div className={`services-section__grid services-section__grid--cols-${tier.cols}`}>
      {Array.from({ length: tier.skeleton }).map((_, i) => (
        <article key={i} className="services-section__card services-section__card--skeleton" aria-hidden>
          <div className="services-section__skel-title shimmer" />
          <div className="services-section__skel-line shimmer" />
          <div className="services-section__skel-line shimmer services-section__skel-line--short" />
        </article>
      ))}
    </div>
  );
}

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState('individuals');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tier = useGridTier();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getServices()
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Не удалось загрузить услуги');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const cat = activeTab === 'individuals' ? SERVICE_CATEGORY_INDIVIDUALS : SERVICE_CATEGORY_BUSINESS;
    return services.filter((s) => s.category === cat);
  }, [services, activeTab]);

  const listHref = LIST_HREF[activeTab];

  return (
    <section className="block-section services-section">
      <div className="services-section__inner">
        <div className="services-section__panel">
          <h2 className="services-section__title">Наши услуги</h2>
          <p className="services-section__text">
            Юридическая помощь с прозрачными условиями: фиксированная цена, диапазон или стоимость по договорённости —
            как удобнее в вашей ситуации.
          </p>
          <div className="button-block services-section__buttons">
            <button
              type="button"
              className={`services-section__btn ${activeTab === 'individuals' ? 'services-section__btn--active' : ''}`}
              onClick={() => setActiveTab('individuals')}
            >
              Для физ. лиц
            </button>
            <button
              type="button"
              className={`services-section__btn ${activeTab === 'business' ? 'services-section__btn--active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Для бизнеса
            </button>
          </div>
        </div>

        <div className="services-section__content-area">
          {loading && <ServicesGridSkeleton tier={tier} />}
          {error && !loading && <p className="services-section__hint services-section__hint--error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="services-section__hint">В этом разделе пока нет услуг.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <ServicesGrid services={filtered} tier={tier} listHref={listHref} />
          )}
        </div>
      </div>
    </section>
  );
}
