import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { getPosts } from '../../lib/api';
import { newsSearchHref } from '../../lib/newsLinks';
import PostsPagination from '../../components/PostsPagination';
import HomeFooter from '../../components/home/HomeFooter';

const TYPE_LABELS = {
  article: 'Статья',
  news: 'Новость',
  page: 'Страница',
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: 'news', label: 'Новости' },
  { value: 'article', label: 'Статьи' },
];

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

function buildNewsQuery({ q = '', type = '' } = {}) {
  const query = {};
  const trimmed = String(q || '').trim();
  if (trimmed) query.q = trimmed;
  if (type === 'news' || type === 'article' || type === 'page') query.type = type;
  return query;
}

export default function NewsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    const type = typeof router.query.type === 'string' ? router.query.type : '';
    const validType = type === 'news' || type === 'article' || type === 'page' ? type : '';
    setSearchInput(q);
    setSearchQuery(q);
    setTypeFilter(validType);
    setPage(1);
  }, [router.isReady, router.query.q, router.query.type]);

  useEffect(() => {
    if (!router.isReady) return;
    setLoading(true);
    setError('');
    getPosts({
      status: 'published',
      page,
      per_page: PER_PAGE,
      q: searchQuery || undefined,
      type: typeFilter || undefined,
    })
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
  }, [router.isReady, page, searchQuery, typeFilter]);

  const lastPage = meta?.last_page ?? 1;
  const hasActiveFilters = Boolean(searchQuery || typeFilter);

  const pushFilters = useCallback(
    (next) => {
      router.push({ pathname: '/news', query: buildNewsQuery(next) }, undefined, { shallow: true });
    },
    [router],
  );

  const applySearch = useCallback(() => {
    pushFilters({ q: searchInput, type: typeFilter });
  }, [pushFilters, searchInput, typeFilter]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    router.push('/news', undefined, { shallow: true });
  }, [router]);

  const handleTypeChange = useCallback(
    (e) => {
      const nextType = e.target.value;
      setTypeFilter(nextType);
      pushFilters({ q: searchInput, type: nextType });
    },
    [pushFilters, searchInput],
  );

  const typeLabel = TYPE_FILTER_OPTIONS.find((o) => o.value === typeFilter)?.label;

  const emptyMessage = hasActiveFilters
    ? 'По выбранным фильтрам ничего не найдено.'
    : 'Пока нет опубликованных новостей.';

  return (
    <div className="page news-page">
      <section className="page-section block-section">
      <h1 className="page-heading news-page__title">Новости и публикации</h1>

      <form
        className="news-page__search"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <div className="news-page__search-row">
          <input
            id="news-search"
            type="search"
            className="news-page__search-input"
            placeholder="Поиск: заголовок, тег, описание…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
            aria-label="Поиск публикаций"
          />
          <select
            className="news-page__search-type"
            value={typeFilter}
            onChange={handleTypeChange}
            aria-label="Тип публикации"
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="submit" className="news-page__search-btn">
            Найти
          </button>
          {hasActiveFilters && (
            <button type="button" className="news-page__search-clear" onClick={clearFilters}>
              Сбросить
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <p className="news-page__search-hint">
            {searchQuery && <>Запрос: «{searchQuery}»</>}
            {searchQuery && typeLabel && typeLabel !== 'Все типы' && ' · '}
            {typeLabel && typeLabel !== 'Все типы' && <>Тип: {typeLabel}</>}
            {meta?.total != null && <> · Найдено: {meta.total}</>}
          </p>
        )}
      </form>

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
      {!loading && !error && items.length === 0 && <p>{emptyMessage}</p>}
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
                          <Link key={tag} href={newsSearchHref(tag)} className="news-card__tag">#{tag}</Link>
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
