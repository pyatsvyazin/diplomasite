import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { getPostBySlug, getRelatedPosts } from '../../lib/api';
import { newsSearchHref } from '../../lib/newsLinks';
import PostsPagination from '../../components/PostsPagination';
import HomeFooter from '../../components/home/HomeFooter';

const RELATED_PER_PAGE = 4;

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

function buildRelatedExcerpt(item) {
  if (item.excerpt?.trim()) {
    const text = item.excerpt.trim();
    return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  }
  const text = (item.content?.content || []).map(stripText).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

function formatShortDate(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RelatedCompactCard({ item }) {
  const excerpt = buildRelatedExcerpt(item);

  return (
    <article className="post-related-card">
      <time className="post-related-card__date" dateTime={item.published_at || item.created_at}>
        {formatShortDate(item.published_at || item.created_at)}
      </time>
      <Link href={`/news/${item.slug}`} className="post-related-card__cover" tabIndex={-1} aria-hidden>
        {item.cover_image_url ? (
          <img src={item.cover_image_url} alt="" className="post-related-card__img" />
        ) : (
          <div
            className="post-related-card__img post-related-card__img--placeholder"
            style={{ background: item.cover_color || undefined }}
          />
        )}
      </Link>
      <div className="post-related-card__body">
        <p className="post-related-card__type">{TYPE_LABELS[item.type] || item.type}</p>
        <h3 className="post-related-card__title">
          <Link href={`/news/${item.slug}`} className="post-related-card__title-link">
            {item.title}
          </Link>
        </h3>
        {excerpt && <p className="post-related-card__excerpt">{excerpt}</p>}
      </div>
    </article>
  );
}

function RelatedCompactSkeleton() {
  return (
    <article className="post-related-card post-related-card--skeleton" aria-hidden>
      <div className="post-related-card__date shimmer" />
      <div className="post-related-card__cover shimmer" />
      <div className="post-related-card__body">
        <div className="post-related-card__type shimmer" />
        <div className="post-related-card__title-line shimmer" />
        <div className="post-related-card__title-line shimmer" />
        <div className="post-related-card__title-line post-related-card__title-line--short shimmer" />
        <div className="post-related-card__excerpt-line shimmer" />
        <div className="post-related-card__excerpt-line post-related-card__excerpt-line--short shimmer" />
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
  const [relatedMeta, setRelatedMeta] = useState(null);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !slug) return;
    setPost(null);
    setRelated([]);
    setRelatedMeta(null);
    setRelatedPage(1);
    setLoading(true);
    setError('');
    getPostBySlug(slug)
      .then(setPost)
      .catch((e) => setError(e.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [router.isReady, slug]);

  useEffect(() => {
    if (!post?.slug) return;
    const tags = Array.isArray(post.keywords) ? post.keywords.filter(Boolean) : [];
    if (tags.length === 0) {
      setRelated([]);
      setRelatedMeta(null);
      setRelatedLoading(false);
      return;
    }
    setRelatedLoading(true);
    getRelatedPosts(post.slug, { page: relatedPage, per_page: RELATED_PER_PAGE })
      .then(({ data, meta }) => {
        setRelated(data);
        setRelatedMeta(meta);
      })
      .catch(() => {
        setRelated([]);
        setRelatedMeta(null);
      })
      .finally(() => setRelatedLoading(false));
  }, [post, relatedPage]);

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
              <RelatedCompactSkeleton />
              <RelatedCompactSkeleton />
              <RelatedCompactSkeleton />
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
                        href={newsSearchHref(tag)}
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
            <div className="post-detail__aside-body">
            {showRelatedSkeleton && (
              <div className="post-detail__related-stack">
                <RelatedCompactSkeleton />
                <RelatedCompactSkeleton />
                <RelatedCompactSkeleton />
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
              <>
                <div className="post-detail__related-stack">
                  {related.map((item) => (
                    <RelatedCompactCard key={item.id} item={item} />
                  ))}
                </div>
                <PostsPagination
                  className="posts-pagination--compact posts-pagination--aside"
                  page={relatedMeta?.current_page || relatedPage}
                  lastPage={relatedMeta?.last_page || 1}
                  onPageChange={(p) => setRelatedPage(p)}
                />
              </>
            )}
            </div>
          </aside>
        </div>
      )}
      <HomeFooter />
    </div>
  );
}
