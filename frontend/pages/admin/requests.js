import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getAdminRequests } from '../../lib/api';
import RequestCard from '../../components/admin/RequestCard';
import PostsPagination from '../../components/PostsPagination';
import { ADMIN_REQUEST_UPDATED_EVENT } from '../../lib/adminEvents';

const STATUS_FILTERS = [
  { value: '', label: 'Все заявки' },
  { value: 'new', label: 'Новые' },
  { value: 'reviewing', label: 'Рассматриваются' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'closed', label: 'Закрытые' },
];

function requestMatchesFilter(request, statusFilter, mineOnly, userId) {
  if (mineOnly && Number(request.lawyer_id) !== Number(userId)) {
    return false;
  }
  if (!statusFilter) return true;
  return request.status === statusFilter;
}

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const isStaff = user?.roles?.some((r) => r.name === 'admin' || r.name === 'lawyer');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const PER_PAGE = 20;

  const load = useCallback((opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    getAdminRequests(statusFilter, page, PER_PAGE, { mine: mineOnly })
      .then(({ data, meta: m }) => {
        setRequests(data || []);
        setMeta(m || null);
      })
      .catch(() => {
        if (!silent) {
          setRequests([]);
          setMeta(null);
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [statusFilter, page, mineOnly]);

  const mergeRequest = useCallback((updated) => {
    if (!updated?.id) return;
    setRequests((prev) => {
      const idx = prev.findIndex((r) => r.id === updated.id);
      const matches = requestMatchesFilter(updated, statusFilter, mineOnly, user?.id);

      if (idx === -1) {
        if (!matches || page !== 1) return prev;
        return [updated, ...prev].slice(0, PER_PAGE);
      }

      if (!matches) {
        return prev.filter((r) => r.id !== updated.id);
      }

      const next = [...prev];
      next[idx] = { ...next[idx], ...updated };
      return next;
    });
  }, [statusFilter, mineOnly, user?.id, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, mineOnly]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onUpdated = (e) => {
      mergeRequest(e.detail?.request);
    };
    window.addEventListener(ADMIN_REQUEST_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(ADMIN_REQUEST_UPDATED_EVENT, onUpdated);
  }, [mergeRequest]);

  const emptyMessage = mineOnly
    ? 'Нет заявок, где вы назначены ответственным.'
    : 'Нет заявок';

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Заявки</h1>
        <div className="admin-toolbar">
          <div className="admin-requests-filters">
            {isStaff && (
              <button
                type="button"
                className={`admin-requests-filter admin-requests-filter--mine${mineOnly ? ' admin-requests-filter--active' : ''}`}
                onClick={() => setMineOnly((v) => !v)}
              >
                Мои заявки
              </button>
            )}
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value || 'all'}
                type="button"
                className={`admin-requests-filter ${statusFilter === value ? 'admin-requests-filter--active' : ''}`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="admin-requests-loading">Загрузка заявок...</p>
        ) : requests.length === 0 ? (
          <p className="admin-requests-empty">{emptyMessage}</p>
        ) : (
          <>
            <div className="request-card-list">
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onRequestUpdated={mergeRequest}
                />
              ))}
            </div>
            {meta && meta.last_page > 1 && (
              <div className="admin-requests-pagination">
                <PostsPagination
                  page={page}
                  lastPage={meta.last_page}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
