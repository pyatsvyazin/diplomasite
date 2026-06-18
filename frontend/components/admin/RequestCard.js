import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateAdminRequest } from '../../lib/api';
import LawyerSelectMenu from './LawyerSelectMenu';
import ClientSelectMenu from './ClientSelectMenu';
import StarRating from '../StarRating';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';
import { formatPhone } from '../../lib/phone';
import RequestMeetingsPanel from '../meetings/RequestMeetingsPanel';
import RequestChatLink from '../RequestChatLink';
import { notifyAdminRequestUpdated } from '../../lib/adminEvents';

const STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'Рассматривается',
  in_progress: 'В работе',
  rejected: 'Отклонена',
  closed: 'Закрыта',
};

function canViewRequestMeetings(user, request) {
  if (!user || !request) return false;
  if (user.roles?.some((r) => r.name === 'admin')) return true;
  return Number(request.lawyer_id) === Number(user.id);
}

function AuthorBlock({ request, onRequestUpdated }) {
  const isAuthorized = !!request.client_id;
  const client = request.client;
  const name = client?.full_name ?? request.name ?? '—';
  const email = client?.email ?? request.email ?? '—';
  const phoneRaw = client?.phone ?? request.phone;
  const phone = phoneRaw ? formatPhone(phoneRaw) : '—';

  const [menuOpen, setMenuOpen] = useState(false);

  const handleUnlink = () => {
    updateAdminRequest(request.id, { client_id: null })
      .then((updated) => {
        onRequestUpdated?.(updated);
        notifyAdminRequestUpdated(updated);
      });
    setMenuOpen(false);
  };

  return (
    <div className="request-card__author">
      <div className="request-card__author-main">
        {isAuthorized && (
          <Avatar name={client?.full_name} size={40} className="request-card__avatar avatar--user" title="Авторизован" src={getAvatarUrl(client)} />
        )}
        <div className="request-card__author-info">
          <div className="request-card__author-name">{name}</div>
          <div className="request-card__author-meta">{email}</div>
          <div className="request-card__author-meta">{phone}</div>
        </div>
        <div className="request-card__author-actions">
          {isAuthorized ? (
            <>
              <button
                type="button"
                className="request-card__menu-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                title="Действия"
                aria-label="Действия"
              >
                ⋮
              </button>
              {menuOpen && (
                <>
                  <div className="request-card__menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="request-card__dropdown">
                    <button type="button" onClick={handleUnlink}>
                      Отвязать от профиля
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <ClientSelectMenu
              requestId={request.id}
              onSelect={onRequestUpdated}
              onClose={() => setMenuOpen(false)}
              renderTrigger={(onClick) => (
                <button
                  type="button"
                  className="request-card__menu-trigger"
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  title="Привязать к профилю"
                  aria-label="Привязать к профилю"
                >
                  ⋮
                </button>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LawyerBlock({ request, onRequestUpdated }) {
  const lawyer = request.lawyer;
  const [menuOpen, setMenuOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    if (removing) return;
    setRemoving(true);
    updateAdminRequest(request.id, { lawyer_id: null })
      .then((updated) => {
        onRequestUpdated?.(updated);
        notifyAdminRequestUpdated(updated);
        setMenuOpen(false);
      })
      .catch((err) => {
        window.alert(err?.message || 'Не удалось снять юриста');
        setMenuOpen(false);
      })
      .finally(() => setRemoving(false));
  };

  if (lawyer) {
    return (
      <div className="request-card__lawyer">
        <div className="request-card__lawyer-main">
          <Avatar name={lawyer.full_name} size={40} className="request-card__avatar avatar--lawyer" src={getAvatarUrl(lawyer)} />
          <span className="request-card__lawyer-name">{lawyer.full_name}</span>
          <button
            type="button"
            className="request-card__menu-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            title="Действия"
            aria-label="Действия"
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              <div className="request-card__menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="request-card__dropdown">
                <button type="button" onClick={handleRemove} disabled={removing}>
                  {removing ? 'Снятие…' : 'Снять юриста'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const canAssign = request.status === 'new' || request.status === 'reviewing' || request.status === 'in_progress';
  if (!canAssign) return null;

  return (
    <div className="request-card__lawyer request-card__lawyer--empty">
      <LawyerSelectMenu
        requestId={request.id}
        onSelect={onRequestUpdated}
        renderTrigger={(onClick) => (
          <button type="button" className="request-card__assign-btn" onClick={onClick} title="Назначить юриста" aria-label="Назначить юриста">
            +
          </button>
        )}
      />
    </div>
  );
}

export default function RequestCard({ request, onRequestUpdated }) {
  const { user } = useAuth();
  const showMeetings = canViewRequestMeetings(user, request);
  const [status, setStatus] = useState(request.status);

  useEffect(() => {
    setStatus(request.status);
  }, [request.status, request.lawyer_id, request.client_id, request.review]);

  const handleStatusChange = (e) => {
    const next = e.target.value;
    const prev = status;
    if (next === prev) return;

    setStatus(next);
    onRequestUpdated?.({ ...request, status: next });

    updateAdminRequest(request.id, { status: next })
      .then((updated) => {
        setStatus(updated.status);
        onRequestUpdated?.(updated);
        notifyAdminRequestUpdated(updated);
      })
      .catch(() => {
        setStatus(prev);
        onRequestUpdated?.({ ...request, status: prev });
      });
  };

  const createdAt = request.created_at
    ? new Date(request.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <div className="request-card request-card--with-chat">
      <RequestChatLink requestId={request.id} />
      <div className="request-card__row">
        <div className="request-card__col request-card__col--author">
          <AuthorBlock request={request} onRequestUpdated={onRequestUpdated} />
        </div>
        <div className="request-card__col request-card__col--body">
          <div className="request-card__time">{createdAt}</div>
          {request.subject && (
            <div className="request-card__subject">Тема: {request.subject}</div>
          )}
          {!request.review && (
            <div className="request-card__status-row">
              <label className="request-card__status-label">
                Статус
                <select
                  className={`request-card__status request-card__status--${status}`}
                  value={status}
                  onChange={handleStatusChange}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="request-card__message">{request.message || '—'}</div>
          {showMeetings && (
            <RequestMeetingsPanel requestId={request.id} request={request} showCreateButton />
          )}
            {request.review && (
              <div className="request-card__review">
                <div className="request-card__review-title">Отзыв клиента</div>
                <div className="request-card__review-rating">
                  <StarRating value={(request.review.rating || 0) / 2} />
                </div>
                <div className="request-card__review-text">{request.review.message}</div>
              </div>
            )}
        </div>
      </div>
      {!request.review && (
        <div className="request-card__row2">
          <div className="request-card__col request-card__col--author" />
          <div className="request-card__col request-card__col--body">
            <LawyerBlock request={request} onRequestUpdated={onRequestUpdated} />
          </div>
        </div>
      )}
    </div>
  );
}