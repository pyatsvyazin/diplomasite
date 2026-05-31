import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead } from '../lib/api';

const INITIAL_LIMIT = 30;
const LOAD_MORE_LIMIT = 15;

function formatNotifTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NavNotifications({ open, onOpenChange }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const refreshCount = useCallback(() => {
    getNotifications({ limit: 1, offset: 0 })
      .then(({ meta }) => setUnread(Number(meta?.unread_count) || 0))
      .catch(() => setUnread(0));
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 45000);
    return () => clearInterval(id);
  }, [refreshCount]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const { data, meta } = await getNotifications({ limit: INITIAL_LIMIT, offset: 0 });
      setItems(data || []);
      setHasMore(Boolean(meta?.has_more));
      await markAllNotificationsRead();
      setUnread(0);
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = items.length;
    try {
      const { data, meta } = await getNotifications({ limit: LOAD_MORE_LIMIT, offset });
      setItems((prev) => [...prev, ...(data || [])]);
      setHasMore(Boolean(meta?.has_more));
    } catch {
      /* keep current list */
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setHasMore(false);
    loadInitial();
  }, [open, loadInitial]);

  const handleToggle = (e) => {
    e.stopPropagation();
    onOpenChange(!open);
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div className={`nav-notifications${open ? ' nav-notifications--open' : ''}`}>
      <button
        type="button"
        className="nav-notifications__trigger"
        onClick={handleToggle}
        aria-label="Уведомления"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a5 5 0 00-5 5v2.5c0 .7-.2 1.4-.6 2L5 14.5V16h14v-1.5l-1.4-2c-.4-.6-.6-1.3-.6-2V8a5 5 0 00-5-5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="nav-notifications__badge">{badge}</span>}
      </button>
      {open && (
        <div className="nav-notifications__panel nav__profile-panel" role="dialog" aria-label="Уведомления">
          <div className="nav-notifications__head">
            <h3 className="nav-notifications__title">Уведомления</h3>
          </div>
          <div className="nav-notifications__body">
            {loading && <p className="nav-notifications__empty">Загрузка…</p>}
            {!loading && items.length === 0 && <p className="nav-notifications__empty">Нет уведомлений</p>}
            {!loading &&
              items.map((n) => (
                <div key={n.id} className="nav-notifications__item">
                  <p className="nav-notifications__item-title">{n.title}</p>
                  {n.body && <p className="nav-notifications__item-body">{n.body}</p>}
                  {n.link && (
                    <Link href={n.link} className="nav-notifications__item-link" onClick={() => onOpenChange(false)}>
                      Открыть
                    </Link>
                  )}
                  <time className="nav-notifications__item-time">{formatNotifTime(n.created_at)}</time>
                </div>
              ))}
            {!loading && hasMore && (
              <button
                type="button"
                className="nav-notifications__more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Загрузка…' : '+ ещё'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
