import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getService } from '../../lib/api';
import HomeFooter from '../../components/home/HomeFooter';

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [service, setService] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getService(id)
      .then((data) => {
        if (!cancelled) setService(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Ошибка загрузки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!router.isReady) {
    return (
      <div className="page services-detail-page">
        <p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="page services-detail-page">
      <p className="services-detail-page__back">
        <Link href="/">← На главную</Link>
      </p>

      {loading && <p>Загрузка…</p>}
      {error && !loading && <p className="services-detail-page__error">{error}</p>}

      {!loading && service && (
        <>
          <p className="services-detail-page__category">{service.category}</p>
          <h1 className="services-detail-page__title">{service.name}</h1>
          <p className="services-detail-page__price">{service.formatted_price}</p>
          {service.full_description ? (
            <div className="services-detail-page__body">{service.full_description}</div>
          ) : service.short_description ? (
            <p className="services-detail-page__body">{service.short_description}</p>
          ) : (
            <p className="services-detail-page__muted">Подробное описание скоро появится.</p>
          )}
        </>
      )}
      <HomeFooter />
    </div>
  );
}
