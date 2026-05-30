import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminRequests } from '../../lib/api';
import RequestCard from '../../components/admin/RequestCard';
import PostsPagination from '../../components/PostsPagination';

const STATUS_FILTERS = [
  { value: '', label: 'Все заявки' },
  { value: 'new', label: 'Новые' },
  { value: 'reviewing', label: 'Рассматриваются' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'closed', label: 'Закрытые' },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const PER_PAGE = 20;

  const load = () => {
    setLoading(true);
    getAdminRequests(statusFilter, page, PER_PAGE)
      .then(({ data, meta: m }) => {
        setRequests(data || []);
        setMeta(m || null);
      })
      .catch(() => {
        setRequests([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(load, [statusFilter, page]);

  return (
    <AdminLayout>
      <div className="page">
        <h1 className="admin-page-title">Заявки</h1>
        <div className="admin-toolbar">
          <div className="admin-requests-filters">
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
          <p className="admin-requests-empty">Нет заявок</p>
        ) : (
          <>
            <div className="request-card-list">
              {requests.map((r) => (
                <RequestCard key={r.id} request={r} onRefresh={load} />
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