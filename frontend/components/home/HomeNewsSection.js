import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPosts } from '../../lib/api';

function stripText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!Array.isArray(node.content)) return '';
  return node.content.map(stripText).join(' ');
}

function buildExcerpt(item) {
  const text = (item.content?.content || []).map(stripText).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Текст публикации появится после заполнения контента.';
  return text.slice(0, 160) + (text.length > 160 ? '…' : '');
}

function formatDate(iso) {
  if (!iso) return 'Дата не указана';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Дата не указана';
  return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function NewsCard({ item }) {
  return (
    <article className="news-card">
      <div className="news-card__cover-wrap">
        <Link href={`/news/${item.slug}`}>
          {item.cover_image_url ? (
            <img src={item.cover_image_url} alt={item.title} className="news-card__cover" />
          ) : (
            <div
              className="news-card__cover news-card__cover--placeholder"
              style={{ background: item.cover_color || undefined }}
            />
          )}
        </Link>
      </div>
      <div className="news-card__body">
        <div className="news-card__meta">
          <span>{formatDate(item.published_at || item.created_at)}</span>
          <span className="news-card__dot">•</span>
          <span>Новость</span>
        </div>
        <h3 className="news-card__title">
          <Link href={`/news/${item.slug}`} className="news-card__title-link">
            {item.title}
          </Link>
        </h3>
        <p className="news-card__excerpt">{buildExcerpt(item)}</p>
        <p className="news-card__author">{item.published_name || 'Автор'}</p>
      </div>
    </article>
  );
}

export default function HomeNewsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPosts({ status: 'published', type: 'news', per_page: 3, page: 1 })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Ошибка загрузки новостей'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="block-section home-news">
      <div className="home-news__layout">
        <div className="home-news__panel">
          <h2 className="home-news__title">Наши новости</h2>
          <p className="home-news__text">
            Здесь мы делимся самыми свежими событиями: важными изменениями, полезными комментариями юристов и короткими
            материалами по актуальным вопросам. Если хотите следить за обновлениями и быть в курсе, заглядывайте в раздел
            новостей регулярно.
          </p>
          <Link href="/news" className="home-news__more">
            Перейти к новостям
          </Link>
        </div>

        <div className="home-news__cards">
          {loading && (
            <ul className="home-news__grid" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="news-grid__item">
                  <article className="news-card news-card--skeleton">
                    <div className="news-card__cover-wrap">
                      <div className="news-card__cover shimmer" />
                    </div>
                    <div className="news-card__body">
                      <div className="news-skeleton__line shimmer news-skeleton__line--title" />
                      <div className="news-skeleton__line shimmer news-skeleton__line--full" />
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {!loading && error && <p className="home-news__error">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="home-news__empty">Пока нет опубликованных новостей.</p>
          )}
          {!loading && !error && items.length > 0 && (
            <ul className="home-news__grid">
              {items.map((item) => (
                <li key={item.id} className="news-grid__item">
                  <NewsCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
