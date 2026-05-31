import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { getPostBySlug, getPosts } from '../../lib/api';
import HomeFooter from '../../components/home/HomeFooter';

const TYPE_LABELS = {
  article: 'Статья',
  news: 'Новость',
  page: 'Страница',
};

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

function blockAlignStyle(attrs) {
  const ta = attrs?.textAlign;
  if (ta && ['left', 'center', 'right', 'justify'].includes(ta)) {
    return { textAlign: ta };
  }
  return undefined;
}

function renderNode(node, key) {
  if (!node) return null;
  if (node.type === 'text') {
    let el = <>{node.text || ''}</>;
    if (node.marks?.some((m) => m.type === 'bold')) el = <strong>{el}</strong>;
    if (node.marks?.some((m) => m.type === 'italic')) el = <em>{el}</em>;
    if (node.marks?.some((m) => m.type === 'underline')) el = <u>{el}</u>;
    if (node.marks?.some((m) => m.type === 'strike')) el = <s>{el}</s>;
    if (node.marks?.some((m) => m.type === 'code')) el = <code className="post-body__code">{el}</code>;
    const linkMark = node.marks?.find((m) => m.type === 'link');
    if (linkMark?.attrs?.href) {
      return (
        <a key={key} href={linkMark.attrs.href} target="_blank" rel="noreferrer noopener">
          {el}
        </a>
      );
    }
    return <span key={key}>{el}</span>;
  }
  const children = (node.content || []).map((child, idx) => renderNode(child, `${key}-${idx}`));
  if (node.type === 'heading') {
    const level = node.attrs?.level || 2;
    const st = blockAlignStyle(node.attrs);
    if (level === 1) {
      return (
        <h1 key={key} style={st}>
          {children}
        </h1>
      );
    }
    if (level === 3) {
      return (
        <h3 key={key} style={st}>
          {children}
        </h3>
      );
    }
    return (
      <h2 key={key} style={st}>
        {children}
      </h2>
    );
  }
  if (node.type === 'paragraph') {
    return (
      <p key={key} style={blockAlignStyle(node.attrs)}>
        {children}
      </p>
    );
  }
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>;
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>;
  if (node.type === 'listItem') return <li key={key}>{children}</li>;
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>;
  if (node.type === 'codeBlock') {
    return (
      <pre key={key}>
        <code>{children}</code>
      </pre>
    );
  }
  if (node.type === 'horizontalRule') return <hr key={key} />;
  if (node.type === 'image') {
    return <img key={key} src={node.attrs?.src} alt={node.attrs?.alt || ''} />;
  }
  if (node.type === 'youtube') {
    return (
      <iframe
        key={key}
        src={node.attrs?.src}
        title={`video-${key}`}
        width={node.attrs?.width || 640}
        height={node.attrs?.height || 360}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }
  return <div key={key}>{children}</div>;
}

function mergeRelatedByTags(lists, currentId) {
  const map = new Map();
  for (const list of lists) {
    for (const p of list) {
      if (!p || p.id === currentId) continue;
      if (!map.has(p.id)) map.set(p.id, p);
    }
  }
  return [...map.values()].sort((a, b) => {
    const da = new Date(a.published_at || a.created_at || 0).getTime();
    const db = new Date(b.published_at || b.created_at || 0).getTime();
    return db - da;
  });
}

function RelatedNewsCard({ item }) {
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
          <span>{TYPE_LABELS[item.type] || item.type}</span>
        </div>
        <h2 className="news-card__title">
          <Link href={`/news/${item.slug}`} className="news-card__title-link">
            {item.title}
          </Link>
        </h2>
        <p className="news-card__excerpt">{buildExcerpt(item)}</p>
        {Array.isArray(item.keywords) && item.keywords.length > 0 && (
          <div className="news-card__tags">
            {item.keywords.slice(0, 5).map((tag) => (
              <Link
                key={tag}
                href={`/news/tag/${encodeURIComponent(tag)}`}
                className="news-card__tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        <p className="news-card__author">{item.published_name || 'Автор'}</p>
      </div>
    </article>
  );
}

function RelatedCardSkeleton() {
  return (
    <article className="news-card news-card--skeleton" aria-hidden>
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
  );
}

function ArticleSheetSkeleton() {
  return (
    <div className="post-detail__sheet" aria-hidden>
      <div className="post-detail-skel__title shimmer" />
      <div className="post-detail-skel__meta shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--wide shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--wide shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--mid shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--wide shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--short shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--wide shimmer" />
      <div className="post-detail-skel__line post-detail-skel__line--mid shimmer" />
    </div>
  );
}

export default function NewsPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !slug) return;
    setPost(null);
    setRelated([]);
    setLoading(true);
    setError('');
    getPostBySlug(slug)
      .then(setPost)
      .catch((e) => setError(e.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [router.isReady, slug]);

  useEffect(() => {
    if (!post?.id) return;
    setRelated([]);
    const tags = Array.isArray(post.keywords) ? post.keywords.filter(Boolean).slice(0, 6) : [];
    if (tags.length === 0) {
      setRelatedLoading(false);
      return;
    }
    setRelatedLoading(true);
    Promise.all(
      tags.map((tag) =>
        getPosts({ status: 'published', tag, per_page: 20, page: 1 })
          .then((r) => r.data)
          .catch(() => [])
      )
    )
      .then((lists) => {
        setRelated(mergeRelatedByTags(lists, post.id).slice(0, 8));
      })
      .finally(() => setRelatedLoading(false));
  }, [post]);

  const content = useMemo(() => post?.content?.content || [], [post]);

  const metaLine = useMemo(() => {
    if (!post) return '';
    const parts = [
      TYPE_LABELS[post.type] || post.type,
      post.published_name || 'Автор',
      post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU') : null,
    ].filter(Boolean);
    return parts.join(' • ');
  }, [post]);

  const showFullSkeleton = !router.isReady || loading;
  const showRelatedSkeleton = !showFullSkeleton && post && relatedLoading && post.keywords?.length > 0;

  return (
    <div className="page post-detail">
      {showFullSkeleton && (
        <div className="post-detail__grid">
          <div className="post-detail__main">
            <ArticleSheetSkeleton />
          </div>
          <aside className="post-detail__aside">
            <h2 className="post-detail__aside-title">По теме</h2>
            <div className="post-detail__related-stack">
              <RelatedCardSkeleton />
              <RelatedCardSkeleton />
            </div>
          </aside>
        </div>
      )}

      {!showFullSkeleton && error && <p>{error}</p>}

      {!showFullSkeleton && !error && post && (
        <div className="post-detail__grid">
          <div className="post-detail__main">
            <article className="post-detail__sheet">
              <header className="post-detail__header">
                <h1>{post.title}</h1>
                <p className="post-detail__meta">{metaLine}</p>
                {Array.isArray(post.keywords) && post.keywords.length > 0 && (
                  <div className="post-detail__tags">
                    {post.keywords.map((tag) => (
                      <Link
                        key={tag}
                        href={`/news/tag/${encodeURIComponent(tag)}`}
                        className="post-detail__tag"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </header>
              <div className="post-body">{content.map((node, idx) => renderNode(node, idx))}</div>
            </article>
          </div>

          <aside className="post-detail__aside" aria-label="Связанные материалы">
            <h2 className="post-detail__aside-title">По теме</h2>
            {showRelatedSkeleton && (
              <div className="post-detail__related-stack">
                <RelatedCardSkeleton />
                <RelatedCardSkeleton />
              </div>
            )}
            {!showRelatedSkeleton && (!post.keywords || post.keywords.length === 0) && (
              <p className="post-detail__aside-note">
                У этой публикации нет тегов — связанные материалы не подбираются.
              </p>
            )}
            {!showRelatedSkeleton && post.keywords?.length > 0 && related.length === 0 && (
              <p className="post-detail__aside-note">
                Других опубликованных материалов с этими тегами пока нет.
              </p>
            )}
            {!showRelatedSkeleton && related.length > 0 && (
              <div className="post-detail__related-stack">
                {related.map((item) => (
                  <RelatedNewsCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
      <HomeFooter />
    </div>
  );
}
