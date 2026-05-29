import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/api';

export default function NotificationsTab() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then(({ data, meta }) => {
        setItems(data);
        setUnread(meta.unread_count ?? 0);
      })
      .catch(() => {
        setItems([]);
        setUnread(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  return (
    <div className="notifications-tab">
      <div className="notifications-tab__head">
        <h2 className="notifications-tab__title">Уведомления</h2>
        {unread > 0 && (
          <button type="button" className="notifications-tab__read-all" onClick={handleReadAll}>
            Прочитать все ({unread})
          </button>
        )}
      </div>
      {loading && <p>Загрузка…</p>}
      {!loading && items.length === 0 && <p>Уведомлений пока нет.</p>}
      <ul className="notifications-tab__list">
        {items.map((n) => (
          <li
            key={n.id}
            className={`notifications-tab__item${!n.read_at ? ' notifications-tab__item--unread' : ''}`}
          >
            <div className="notifications-tab__item-head">
              <strong>{n.title}</strong>
              <span className="notifications-tab__date">
                {n.created_at ? new Date(n.created_at).toLocaleString('ru-RU') : ''}
              </span>
            </div>
            {n.body && <p className="notifications-tab__body">{n.body}</p>}
            <div className="notifications-tab__actions">
              {n.link && (
                <Link href={n.link} className="notifications-tab__link">
                  Перейти
                </Link>
              )}
              {!n.read_at && (
                <button type="button" className="notifications-tab__mark" onClick={() => handleRead(n.id)}>
                  Прочитано
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
