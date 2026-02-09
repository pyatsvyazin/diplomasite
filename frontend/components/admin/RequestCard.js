import { useState } from 'react';
import { updateAdminRequest, getAdminLawyers } from '../../lib/api';
import LawyerSelectMenu from './LawyerSelectMenu';
import ClientSelectMenu from './ClientSelectMenu';
import StarRating from '../StarRating';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';

const STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'Рассматривается',
  in_progress: 'В работе',
  rejected: 'Отклонена',
  closed: 'Закрыта',
};

function AuthorBlock({ request, onRefresh }) {
  const isAuthorized = !!request.client_id;
  const client = request.client;
  const name = client?.full_name ?? request.name ?? '—';
  const email = client?.email ?? request.email ?? '—';
  const phone = client?.phone ?? request.phone ?? '—';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleUnlink = () => {
    updateAdminRequest(request.id, { client_id: null }).then(onRefresh);
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
              onSelect={onRefresh}
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

function LawyerBlock({ request, onAssign, onRefresh }) {
  const lawyer = request.lawyer;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleRemove = () => {
    updateAdminRequest(request.id, { lawyer_id: null }).then(onRefresh);
    setMenuOpen(false);
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
                <button type="button" onClick={handleRemove}>Снять юриста</button>
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
        onSelect={() => onRefresh()}
        renderTrigger={(onClick) => (
          <button type="button" className="request-card__assign-btn" onClick={onClick} title="Назначить юриста" aria-label="Назначить юриста">
            +
          </button>
        )}
      />
    </div>
  );
}

export default function RequestCard({ request, onRefresh, onLinkClient }) {
  const [status, setStatus] = useState(request.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = (e) => {
    const next = e.target.value;
    setStatus(next);
    setUpdating(true);
    updateAdminRequest(request.id, { status: next })
      .then(() => onRefresh())
      .catch(() => setStatus(request.status))
      .finally(() => setUpdating(false));
  };

  const createdAt = request.created_at
    ? new Date(request.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <div className="request-card">
      <div className="request-card__row">
        <div className="request-card__col request-card__col--author">
          <AuthorBlock request={request} onRefresh={onRefresh} />
        </div>
        <div className="request-card__col request-card__col--body">
          <div className="request-card__time">{createdAt}</div>
          {request.subject && (
            <div className="request-card__subject">Тема: {request.subject}</div>
          )}
          {!request.review && (
            <label className="request-card__status-label">
              Статус
              <select
                className="request-card__status"
                value={status}
                onChange={handleStatusChange}
                disabled={updating}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          )}
          <div className="request-card__message">{request.message || '—'}</div>
            {request.review && (
              <div className="request-card__review">
                <strong>Отзыв:</strong> <StarRating value={(request.review.rating || 0) / 2} /> — {request.review.message}
              </div>
            )}
        </div>
      </div>
      {!request.review && (
        <div className="request-card__row2">
          <div className="request-card__col request-card__col--author" />
          <div className="request-card__col request-card__col--body">
            <LawyerBlock request={request} onAssign={() => {}} onRefresh={onRefresh} />
          </div>
        </div>
      )}
    </div>
  );
}