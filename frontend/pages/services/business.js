import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SERVICE_CATEGORY_BUSINESS } from '../../constants/serviceCategories';
import { getServices } from '../../lib/api';
import HomeFooter from '../../components/home/HomeFooter';

export default function ServicesBusinessPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((data) => {
        if (!cancelled) {
          setItems(data.filter((s) => s.category === SERVICE_CATEGORY_BUSINESS));
        }
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
  }, []);

  return (
    <div className="page services-list-page">
      <h1>Услуги для бизнеса</h1>
      {loading && <p>Загрузка…</p>}
      {error && <p className="services-list-page__error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p>В этом разделе пока нет услуг — каталог пополняется.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="services-list-page__list">
          {items.map((s) => (
            <li key={s.id}>
              <Link href={`/services/${s.id}`} className="services-list-page__link">
                <span className="services-list-page__name">{s.name}</span>
                <span className="services-list-page__price">{s.formatted_price}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <HomeFooter />
    </div>
  );
}
