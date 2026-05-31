import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SERVICE_CATEGORY_BUSINESS, SERVICE_CATEGORY_INDIVIDUALS } from '../../constants/serviceCategories';
import { getServices } from '../../lib/api';

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState('individuals');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div className="services-section__content services-section__content--cards">
          {loading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <article key={i} className="services-section__card services-section__card--skeleton" aria-hidden>
                  <div className="services-section__skel-title shimmer" />
                  <div className="services-section__skel-line shimmer" />
                  <div className="services-section__skel-line shimmer services-section__skel-line--short" />
                </article>
              ))}
            </>
          )}
          {error && !loading && <p className="services-section__hint services-section__hint--error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="services-section__hint">В этом разделе пока нет услуг.</p>
          )}
          {!loading &&
            !error &&
            filtered.map((s) => (
              <article key={s.id} className="services-section__card">
                <Link href={`/services/${s.id}`} className="services-section__card-link">
                  <h3 className="services-section__card-title">{s.name}</h3>
                  {s.short_description ? (
                    <p className="services-section__card-desc">{s.short_description}</p>
                  ) : null}
                  <span className="services-section__price">{s.formatted_price}</span>
                  <span className="services-section__arrow" aria-hidden>
                    ›
                  </span>
                </Link>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
