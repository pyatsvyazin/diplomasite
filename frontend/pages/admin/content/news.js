import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import ModalShell from '../../../components/ModalShell';
import TipTapEditor, { EMPTY_DOC } from '../../../components/admin/TipTapEditor';
import { createAdminPost, getAdminPosts, updateAdminPost, uploadAdminPostImage } from '../../../lib/api';
import PostsPagination from '../../../components/PostsPagination';

const POSTS_LIST_PER_PAGE = 5;

const TYPE_LABELS = {
  article: 'Статья',
  news: 'Новость',
  page: 'Страница',
};

const STATUS_LABELS = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'В архиве',
};

const PUBLISHED_AS_LABELS = {
  author: 'Автор',
  company: 'Компания',
  custom: 'Пользовательское имя',
};

function slugify(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function textFromNode(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!Array.isArray(node.content)) return '';
  return node.content.map(textFromNode).join(' ');
}

function firstMeaningfulText(json) {
  if (!json || !Array.isArray(json.content)) return '';
  return json.content.map(textFromNode).join(' ').replace(/\s+/g, ' ').trim();
}

function renderNode(node, key) {
  if (!node) return null;
  if (node.type === 'text') {
    let el = <>{node.text || ''}</>;
    if (node.marks?.some((m) => m.type === 'bold')) el = <strong>{el}</strong>;
    if (node.marks?.some((m) => m.type === 'italic')) el = <em>{el}</em>;
    if (node.marks?.some((m) => m.type === 'underline')) el = <u>{el}</u>;
    if (node.marks?.some((m) => m.type === 'strike')) el = <s>{el}</s>;
    if (node.marks?.some((m) => m.type === 'code')) el = <code>{el}</code>;
    const linkMark = node.marks?.find((m) => m.type === 'link');
    if (linkMark?.attrs?.href) {
      return <a key={`${key}-a`} href={linkMark.attrs.href} target="_blank" rel="noreferrer noopener">{el}</a>;
    }
    return <span key={key}>{el}</span>;
  }

  const children = (node.content || []).map((child, idx) => renderNode(child, `${key}-${idx}`));
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 2;
      if (level === 1) return <h1 key={key}>{children}</h1>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h2 key={key}>{children}</h2>;
    }
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'codeBlock':
      return <pre key={key}><code>{children}</code></pre>;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'image':
      return <img key={key} src={node.attrs?.src} alt={node.attrs?.alt || ''} style={{ maxWidth: '100%' }} />;
    case 'youtube':
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
    case 'paragraph':
      return <p key={key}>{children}</p>;
    default:
      return <div key={key}>{children}</div>;
  }
}

const INITIAL_FORM = {
  title: '',
  slug: '',
  content: EMPTY_DOC,
  excerpt: '',
  cover_image_url: '',
  cover_color: '#E5E7EB',
  keywords: [],
  type: 'news',
  status: 'draft',
  published_as: 'author',
  published_name: '',
  is_pinned: false,
};

export default function AdminContentNewsPage() {
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFileName, setCoverFileName] = useState('');
  const [saveState, setSaveState] = useState(''); // "Сохранено", "Автосохранение..."
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [listPage, setListPage] = useState(1);
  const lastSavedRef = useRef('');
  const coverInputRef = useRef(null);
  const selectedPost = useMemo(() => posts.find((p) => p.id === selectedId) || null, [posts, selectedId]);

  const hasChanges = useMemo(() => JSON.stringify(form) !== lastSavedRef.current, [form]);
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (!q) return true;
      return (
        String(p.title || '').toLowerCase().includes(q) ||
        String(p.slug || '').toLowerCase().includes(q)
      );
    });
  }, [posts, search, filterType, filterStatus]);

  const listLastPage = Math.max(1, Math.ceil(filteredPosts.length / POSTS_LIST_PER_PAGE));

  const paginatedPosts = useMemo(() => {
    const start = (listPage - 1) * POSTS_LIST_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_LIST_PER_PAGE);
  }, [filteredPosts, listPage]);

  useEffect(() => {
    setListPage(1);
  }, [search, filterType, filterStatus]);

  useEffect(() => {
    setListPage((p) => Math.min(Math.max(1, p), listLastPage));
  }, [listLastPage]);

  useEffect(() => {
    setLoading(true);
    getAdminPosts()
      .then((data) => {
        setPosts(data);
        if (data.length > 0) {
          selectPost(data[0]);
        } else {
          setForm(INITIAL_FORM);
          lastSavedRef.current = JSON.stringify(INITIAL_FORM);
        }
      })
      .catch((e) => setError(e.message || 'Не удалось загрузить посты'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slugTouched) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
  }, [form.title, slugTouched]);

  useEffect(() => {
    if (!selectedId || !hasChanges) return undefined;
    const timer = setTimeout(() => {
      doSave(form.status, true);
    }, 7000);
    return () => clearTimeout(timer);
  }, [form, selectedId, hasChanges, selectedPost]);

  function selectPost(post) {
    setSelectedId(post.id);
    const next = {
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || EMPTY_DOC,
      excerpt: post.excerpt || '',
      cover_image_url: post.cover_image_url || '',
      cover_color: post.cover_color || '#E5E7EB',
      keywords: Array.isArray(post.keywords) ? post.keywords : [],
      type: post.type || 'news',
      status: post.status || 'draft',
      published_as: post.published_as || 'author',
      published_name: post.published_name || '',
      is_pinned: !!post.is_pinned,
    };
    setForm(next);
    setSlugTouched(true);
    setSaveState('');
    setError('');
    setCoverFileName('');
    lastSavedRef.current = JSON.stringify(next);
  }

  async function doSave(nextStatus = form.status, isAuto = false) {
    const payload = {
      ...form,
      status: nextStatus,
      excerpt: form.excerpt?.trim() || firstMeaningfulText(form.content).slice(0, 180) || null,
      published_name: form.published_as === 'custom' ? (form.published_name || '').trim() : null,
    };

    setSaving(true);
    setError('');
    setSaveState(isAuto ? 'Автосохранение...' : 'Сохранение...');
    try {
      let saved;
      if (selectedId) {
        saved = await updateAdminPost(selectedId, payload);
        setPosts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      } else {
        saved = await createAdminPost(payload);
        setSelectedId(saved.id);
        setPosts((prev) => [saved, ...prev]);
      }
      const normalized = {
        title: saved.title || '',
        slug: saved.slug || '',
        content: saved.content || EMPTY_DOC,
        excerpt: saved.excerpt || '',
        cover_image_url: saved.cover_image_url || '',
        cover_color: saved.cover_color || '#E5E7EB',
        keywords: Array.isArray(saved.keywords) ? saved.keywords : [],
        type: saved.type || 'news',
        status: saved.status || 'draft',
        published_as: saved.published_as || 'author',
        published_name: saved.published_name || '',
        is_pinned: !!saved.is_pinned,
      };
      setForm(normalized);
      lastSavedRef.current = JSON.stringify(normalized);
      setSaveState('Сохранено');
    } catch (e) {
      setError(e.message || 'Ошибка сохранения');
      setSaveState('');
    } finally {
      setSaving(false);
    }
  }

  async function uploadCoverFile(file) {
    setUploadingCover(true);
    setError('');
    try {
      const uploaded = await uploadAdminPostImage(file);
      setForm((prev) => ({ ...prev, cover_image_url: uploaded.url || '' }));
      setSaveState('Обложка загружена');
    } catch (e) {
      setError(e.message || 'Ошибка загрузки обложки');
    } finally {
      setUploadingCover(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page admin-posts-page">
        <h1 className="admin-page-title">Контент: Посты</h1>
        <div className="admin-posts">
          <aside className="admin-posts__sidebar">
            <button
              type="button"
              className="admin-btn admin-posts__new-btn"
              onClick={() => {
                setSelectedId(null);
                setForm(INITIAL_FORM);
                setSlugTouched(false);
                setError('');
                setSaveState('');
                setCoverFileName('');
                lastSavedRef.current = JSON.stringify(INITIAL_FORM);
              }}
            >
              + Новый пост
            </button>
            <input
              type="search"
              className="admin-search admin-posts__search"
              placeholder="Поиск по заголовку или ссылке"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-posts__filters">
              <select className="admin-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Все типы</option>
                <option value="news">Новость</option>
                <option value="article">Статья</option>
                <option value="page">Страница</option>
              </select>
              <select className="admin-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Все статусы</option>
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </select>
            </div>
            {loading ? (
              <p className="admin-empty">Загрузка...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="admin-empty">Посты не найдены</p>
            ) : (
              <>
                <div className="admin-posts__list-wrap">
                  <ul className="admin-posts__list">
                    {paginatedPosts.map((post) => (
                      <li key={post.id}>
                        <button
                          type="button"
                          className={`admin-posts__item ${selectedId === post.id ? 'admin-posts__item--active' : ''}`}
                          onClick={() => selectPost(post)}
                        >
                          <span className="admin-posts__item-title">{post.title}</span>
                          <span className="admin-posts__item-meta">
                            {TYPE_LABELS[post.type] || post.type} •{' '}
                            <span className={`admin-status-chip admin-status-chip--${post.status}`}>
                              {STATUS_LABELS[post.status] || post.status}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {listLastPage > 1 && (
                  <div className="admin-posts__list-pagination">
                    <PostsPagination
                      page={listPage}
                      lastPage={listLastPage}
                      onPageChange={setListPage}
                    />
                  </div>
                )}
              </>
            )}
          </aside>

          <section className="admin-posts__editor">
            {error && <p className="admin-error">{error}</p>}
            <div className="admin-posts__row">
              <label className="admin-posts__label">
                Заголовок
                <input
                  className="admin-search admin-posts__input"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Название поста"
                />
              </label>
              <label className="admin-posts__label">
                Ссылка
                <input
                  className="admin-search admin-posts__input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  placeholder="nazvanie-posta"
                />
              </label>
              <label className="admin-posts__label">
                Текущий статус
                <div className={`admin-posts__status-badge admin-posts__status-badge--${form.status}`}>
                  {STATUS_LABELS[form.status] || form.status}
                </div>
              </label>
            </div>
            <label className="admin-posts__label admin-posts__label--full">
              Загрузить обложку с компьютера
              <div className="admin-posts__file-picker">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  Выбрать файл
                </button>
                <span className="admin-posts__file-name">
                  {coverFileName || (form.cover_image_url ? 'Текущая обложка выбрана' : 'Файл не выбран')}
                </span>
                <div className="admin-posts__cover-inline-tools">
                  <span className="admin-posts__color-label">Цвет</span>
                  <input
                    type="color"
                    className="admin-posts__color-input"
                    value={form.cover_color || '#E5E7EB'}
                    onChange={(e) => setForm((prev) => ({ ...prev, cover_color: e.target.value }))}
                  />
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="admin-posts__file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverFileName(file.name);
                    uploadCoverFile(file);
                  }
                }}
                disabled={uploadingCover}
              />
              {uploadingCover ? <span className="admin-posts__uploading">Загрузка...</span> : null}
            </label>
            {form.cover_image_url ? (
              <div className="admin-posts__cover-preview-wrap">
                <img src={form.cover_image_url} alt="Обложка поста" className="admin-posts__cover-preview" />
                <button
                  type="button"
                  className="admin-posts__cover-delete-btn"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, cover_image_url: '' }));
                    setCoverFileName('');
                    setSaveState('Обложка удалена');
                  }}
                >
                  🗑 Удалить фото
                </button>
              </div>
            ) : (
              <div className="admin-posts__cover-preview-wrap">
                <div className="admin-posts__cover-preview admin-posts__cover-preview--color" style={{ background: form.cover_color || '#E5E7EB' }} />
              </div>
            )}
            <label className="admin-posts__label admin-posts__label--full">
              Ключевые слова / теги (через запятую)
              <input
                className="admin-search admin-posts__input"
                value={form.keywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value
                    .split(',')
                    .map((x) => x.trim().toLowerCase())
                    .filter(Boolean);
                  setForm((prev) => ({ ...prev, keywords: Array.from(new Set(keywords)) }));
                }}
                placeholder="например: новости, договор, суд"
              />
            </label>

            <div className="admin-posts__row">
              <label className="admin-posts__label">
                Тип публикации
                <select
                  className="admin-filter admin-posts__select"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="article">Статья</option>
                  <option value="news">Новость</option>
                  <option value="page">Страница</option>
                </select>
              </label>

              <label className="admin-posts__label">
                Публикация от имени
                <select
                  className="admin-filter admin-posts__select"
                  value={form.published_as}
                  onChange={(e) => setForm((prev) => ({ ...prev, published_as: e.target.value }))}
                >
                  <option value="author">Автор</option>
                  <option value="company">Компания</option>
                  <option value="custom">Пользовательское имя</option>
                </select>
              </label>
            </div>

            {form.published_as === 'custom' && (
              <label className="admin-posts__label admin-posts__label--full">
                Имя для публикации
                <input
                  className="admin-search admin-posts__input"
                  value={form.published_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, published_name: e.target.value }))}
                  placeholder="Имя автора для публикации"
                />
              </label>
            )}

            <TipTapEditor
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              onUploadImage={uploadAdminPostImage}
            />

            <div className="admin-posts__actions">
              <button type="button" className="admin-btn" disabled={saving} onClick={() => doSave(form.status, false)}>
                Сохранить
              </button>
              <button type="button" className="admin-btn" disabled={saving} onClick={() => doSave('published', false)}>
                Опубликовать
              </button>
              <button type="button" className="admin-btn" disabled={saving || form.status !== 'published'} onClick={() => doSave('draft', false)}>
                Снять с публикации
              </button>
              <button type="button" className="admin-btn" disabled={saving || form.status === 'archived'} onClick={() => doSave('archived', false)}>
                В архив
              </button>
              <button type="button" className="admin-btn" disabled={saving || form.status !== 'archived'} onClick={() => doSave('draft', false)}>
                Из архива в черновик
              </button>
              <button type="button" className="admin-btn" onClick={() => setPreviewOpen(true)}>
                Предпросмотр
              </button>
              {saveState ? <span className="admin-posts__save-state">{saveState}</span> : null}
            </div>
          </section>
        </div>

        <ModalShell open={previewOpen} onClose={() => setPreviewOpen(false)} overlayClassName="admin-posts__modal-overlay">
          <div
            className="admin-posts__modal"
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="admin-posts__modal-close" onClick={() => setPreviewOpen(false)}>
              ×
            </button>
            <h2>{form.title || 'Без названия'}</h2>
            <div className="admin-posts__preview">{(form.content?.content || []).map((node, idx) => renderNode(node, `pv-${idx}`))}</div>
          </div>
        </ModalShell>
      </div>
    </AdminLayout>
  );
}
