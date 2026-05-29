import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import RequestChatThread from '../../components/chat/RequestChatThread';
import { useAuth } from '../../context/AuthContext';
import { CHATS_LIST_REFRESH_EVENT } from '../../lib/chatsEvents';
import { getConversations } from '../../lib/api';
import { requestStatusLabel } from '../../constants/requestStatus';

function stripLegacyReplyQuote(content) {
  if (!content || typeof content !== 'string') return '';
  const m = content.match(/^>([^\n]+)\n>([^\n]*)\n\n([\s\S]*)$/);
  return m ? m[3] : content;
}

function previewBodyAfterQuote(msg) {
  return stripLegacyReplyQuote(msg.content || '').trim();
}

function previewFromLastMessage(msg) {
  if (!msg) return 'Нет сообщений';
  if (msg.type === 'system') return msg.content || 'Системное сообщение';

  const body = previewBodyAfterQuote(msg);

  if (msg.type === 'image') {
    if (body) return body.length > 160 ? `${body.slice(0, 157)}…` : body;
    return 'Изображение';
  }
  if (msg.type === 'file') {
    if (body) return body.length > 160 ? `${body.slice(0, 157)}…` : body;
    return 'Файл';
  }

  if (msg.reply_to?.sender?.full_name && body) {
    const q = body.replace(/\s+/g, ' ');
    return q.length > 140 ? `${q.slice(0, 137)}…` : q;
  }
  if (body) return body.length > 180 ? `${body.slice(0, 177)}…` : body;
  return 'Сообщение';
}

function formatListTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ChatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedRid = useMemo(() => {
    const q = router.query.rid;
    if (q == null) return '';
    return Array.isArray(q) ? q[0] : String(q);
  }, [router.query.rid]);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getConversations()
      .then(setItems)
      .catch((e) => setError(e.message || 'Ошибка'))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  /** Обновление списка: событие из чата + тихий опрос, пока вкладка видима */
  useEffect(() => {
    if (authLoading || !user) return undefined;
    let debounceId = null;
    const refresh = () => {
      getConversations()
        .then(setItems)
        .catch(() => {});
    };
    const onRefresh = () => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(refresh, 350);
    };
    window.addEventListener(CHATS_LIST_REFRESH_EVENT, onRefresh);
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      refresh();
    }, 25000);
    return () => {
      window.removeEventListener(CHATS_LIST_REFRESH_EVENT, onRefresh);
      clearInterval(iv);
      if (debounceId) clearTimeout(debounceId);
    };
  }, [authLoading, user]);

  /** Полноэкранный мессенджер: без прокрутки страницы, только колонки с overflow */
  useEffect(() => {
    if (authLoading || !user) return undefined;
    document.documentElement.classList.add('chats-fullpage');
    document.body.classList.add('chats-fullpage');
    return () => {
      document.documentElement.classList.remove('chats-fullpage');
      document.body.classList.remove('chats-fullpage');
    };
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="page chats-page">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page chats-page">
        <p>Войдите в аккаунт.</p>
      </div>
    );
  }

  return (
    <div className={`page chats-page${selectedRid ? ' chats-page--has-rid' : ''}`}>
      <h1 className="chats-page__title">Мои чаты</h1>

      {loading && <p>Загрузка...</p>}
      {error && <p className="request-chat__error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="chats-page__empty">
          Пока нет чатов. Если вы администратор без участия в обращении, список может быть пуст — откройте чат с карточки заявки.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="chats-page__layout">
          <aside className="chats-page__sidebar">
            <ul className="chats-list">
              {items.map((c) => {
                const rid = c.request_id;
                const subject = c.request?.subject || `Заявка #${rid}`;
                const last = c.last_message;
                const t = last?.created_at || c.updated_at;
                const unread = Number(c.unread_count) || 0;
                const active = selectedRid === String(rid);
                const reqStatus = c.request?.status;
                return (
                  <li key={c.id} className={`chats-list__item${active ? ' chats-list__item--active' : ''}`}>
                    <Link href={`/chats?rid=${rid}`} className="chats-list__link" scroll={false}>
                      <div className="chats-list__row">
                        <div>
                          <p className="chats-list__subject">{subject}</p>
                          <p className="chats-list__meta">
                            <span className="chats-list__meta-label">Статус:</span>{' '}
                            {reqStatus ? (
                              <span
                                className={`profile-request-card__status profile-request-card__status--${reqStatus}`}
                              >
                                {requestStatusLabel(reqStatus)}
                              </span>
                            ) : (
                              '—'
                            )}{' '}
                            · {formatListTime(t)}
                          </p>
                          <p className="chats-list__preview">{previewFromLastMessage(last)}</p>
                        </div>
                        {unread > 0 ? <span className="chats-list__badge">{unread > 99 ? '99+' : unread}</span> : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="chats-page__panel">
            {selectedRid && (
              <button
                type="button"
                className="chats-page__mobile-back"
                onClick={() => router.push('/chats')}
              >
                ← К списку
              </button>
            )}
            {selectedRid ? (
              <RequestChatThread key={selectedRid} requestId={selectedRid} embedded />
            ) : (
              <div className="chats-page__placeholder">Выберите чат в списке слева.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
