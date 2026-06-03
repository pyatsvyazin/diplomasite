import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPosts } from '../../lib/api';
import PostsPagination from '../../components/PostsPagination';
import HomeFooter from '../../components/home/HomeFooter';

const TYPE_LABELS = {
  article: 'Статья',
  news: 'Новость',
  page: 'Страница',
};

const PER_PAGE = 12;

function stripText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!Array.isArray(node.content)) return '';
  return node.content.map(stripText).join(' ');
}

function buildExcerpt(item) {
  const text = (item.content?.content || []).map(stripText).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Текст публикации появится после заполнения контента.';
  return text.slice(0, 170) + (text.length > 170 ? '…' : '');
}

function formatDate(iso) {
  if (!iso) return 'Дата не указана';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Дата не указана';
  return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPosts({ status: 'published', page, per_page: PER_PAGE })
      .then(({ data, meta: m }) => {
        setItems(data);
        setMeta(m);
      })
      .catch((e) => {
        setError(e.message || 'Ошибка загрузки');
        setItems([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="page news-page">
      <section className="page-section block-section">
      <h1 className="page-heading news-page__title">Новости и публикации</h1>
      <p className="page-lead news-page__subtitle">Актуальные материалы, комментарии и юридические разборы.</p>

      {loading && (
        <div className="news-grid" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="news-card news-card--skeleton">
              <div className="news-card__cover-wrap">
                <div className="news-card__cover shimmer" />
              </div>
              <div className="news-card__body">
                <div className="news-card__meta">
                  <span className="news-skeleton__pill shimmer" />
                  <span className="news-card__dot">•</span>
                  <span className="news-skeleton__pill news-skeleton__pill--short shimmer" />
                </div>
                <div className="news-skeleton__line shimmer news-skeleton__line--title" />
                <div className="news-skeleton__line shimmer news-skeleton__line--title2" />
                <div className="news-skeleton__line shimmer news-skeleton__line--full" />
                <div className="news-skeleton__line shimmer news-skeleton__line--lg" />
                <div className="news-skeleton__line shimmer news-skeleton__line--author" />
              </div>
            </article>
          ))}
        </div>
      )}

      {error && <p className="news-page__error">{error}</p>}
      {!loading && !error && items.length === 0 && <p>Пока нет опубликованных новостей.</p>}
      {!loading && !error && items.length > 0 && (
        <>
          <ul className="news-grid">
            {items.map((item) => (
              <li key={item.id} className="news-grid__item">
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
                      <span>{TYPE_LABELS[item.type] || item.type}</span>
                    </div>
                    <h2 className="news-card__title">
                      <Link href={`/news/${item.slug}`} className="news-card__title-link">{item.title}</Link>
                    </h2>
                    <p className="news-card__excerpt">{buildExcerpt(item)}</p>
                    {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                      <div className="news-card__tags">
                        {item.keywords.slice(0, 5).map((tag) => (
                          <Link key={tag} href={`/news/tag/${encodeURIComponent(tag)}`} className="news-card__tag">#{tag}</Link>
                        ))}
                      </div>
                    )}
                    <p className="news-card__author">{item.published_name || 'Автор'}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <PostsPagination
            page={page}
            lastPage={lastPage}
            onPageChange={(p) => {
              setPage(p);
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </>
      )}
      </section>
      <HomeFooter />
    </div>
  );
}
